import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { tools, executeTool } from "@/lib/chat/tools";
import { getSystemPrompt } from "@/lib/chat/system-prompt";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ajChat } from "@/lib/arcjet";
import { tokenBucket, request as ajRequest } from "@arcjet/next";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DASH_LIMIT = 20;

// Tools that mutate project data and require a session log
const WRITE_TOOLS = new Set([
  "create_project",
  "update_project",
  "delete_project",
  "create_step",
  "update_step",
  "delete_step",
  "move_step",
  "move_step_to",
  "create_link",
  "delete_link",
]);

export async function POST(req: Request) {
  try {
    // ── Auth check ──────────────────────────────────────────────────────────
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.headers
              .get("cookie")
              ?.split(";")
              .map((c) => {
                const [name, ...rest] = c.trim().split("=");
                return { name, value: rest.join("=") };
              }) ?? [];
          },
          setAll() {
            // Route handler — no response cookies needed for auth read
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }

    // ── Arcjet protection ───────────────────────────────────────────────────
    // Add a per-user token bucket on top of the IP-level bucket in ajChat.
    // This means a single authenticated user can't exhaust the quota for others.
    const aj = ajChat.withRule(
      tokenBucket({
        mode: "LIVE",
        characteristics: ["userId"],
        refillRate: 3,  // 3 messages per minute per user sustained
        interval: 60,
        capacity: 6,    // burst up to 6 before throttling
      })
    );
    const arcjetReq = await ajRequest();
    const decision = await aj.protect(arcjetReq, { userId: user.id, requested: 1 });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return Response.json(
          { message: "Too many requests. Please wait a moment before sending another message." },
          { status: 429 }
        );
      }
      if (decision.reason.isBot()) {
        return Response.json(
          { message: "Automated requests are not allowed." },
          { status: 403 }
        );
      }
      return Response.json({ message: "Request blocked." }, { status: 403 });
    }

    const isOwner = user.email === process.env.OWNER_EMAIL;
    const userName: string | null = isOwner
      ? (user.user_metadata?.full_name || user.user_metadata?.name || "Andres")
      : (user.user_metadata?.full_name || user.user_metadata?.name || null);

    // ── Guest limits ────────────────────────────────────────────────────────
    if (!isOwner) {
      await supabaseAdmin
        .from("guest_limits" as never)
        .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true } as never);

      const { data: limits } = await supabaseAdmin
        .from("guest_limits" as never)
        .select("dash_messages_used")
        .eq("user_id" as never, user.id)
        .single() as { data: { dash_messages_used: number } | null };

      const used = limits?.dash_messages_used ?? 0;
      if (used >= DASH_LIMIT) {
        return Response.json({
          message: `You've used all ${DASH_LIMIT} Dash messages included with your guest session. Thanks for trying Project Intel!`,
        });
      }
    }

    // ── Build conversation history ──────────────────────────────────────────
    const { messages, memory } = (await req.json()) as { messages: ChatCompletionMessageParam[]; memory?: string };
    const context = { userId: user.id, isOwner };

    const history: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: getSystemPrompt(new Date().toISOString().split("T")[0], userName, isOwner, memory),
      },
      ...messages,
    ];

    // ── Log enforcer state — tracked from tool calls this turn ──────────────
    const calledWriteTools = new Set<string>();
    let activeProjectId: string | null = null;
    let modelCreatedLog = false;

    // ── Memory update — captured from save_memory tool calls ─────────────────
    let memoryUpdate: { facts: string[]; replace: boolean } | null = null;

    // ── Tool-calling loop ───────────────────────────────────────────────────
    let finalMessage = "";

    for (let i = 0; i < 20; i++) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: history,
        tools,
        tool_choice: "auto",
      });

      const choice = response.choices[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      history.push(choice.message as any);

      if (choice.finish_reason === "stop") {
        finalMessage = choice.message.content ?? "";

        // ── Log enforcer — fallback only when model skipped the log ────────
        // Fires only if: writes happened, model didn't create a log, and we
        // have a valid project ID captured from the tool call arguments.
        if (calledWriteTools.size > 0 && !modelCreatedLog && activeProjectId) {
          const ops = Array.from(calledWriteTools).join(", ");
          await executeTool(
            "create_log",
            {
              project_id: activeProjectId,
              summary: `Session recorded by system. Operations performed: ${ops}.`,
              agent: "Dash",
            },
            context
          );
        }

        // Increment guest message count on successful completion
        if (!isOwner) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabaseAdmin as any).rpc("increment_dash_messages", { p_user_id: user.id });
        }

        return Response.json({ message: finalMessage, memoryUpdate });
      }

      if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fn = (toolCall as any).function as { name: string; arguments: string };
          const args = JSON.parse(fn.arguments) as Record<string, unknown>;
          const result = await executeTool(fn.name, args, context);

          // Track writes and resolve project ID from call arguments
          if (WRITE_TOOLS.has(fn.name)) {
            calledWriteTools.add(fn.name);

            // project_id is present on step and link tools
            if (typeof args.project_id === "string") {
              activeProjectId = args.project_id;
            }
            // id is the project id on update_project and delete_project
            if ((fn.name === "update_project" || fn.name === "delete_project") && typeof args.id === "string") {
              activeProjectId = args.id;
            }
            // create_project returns the new project — extract id from result
            if (fn.name === "create_project") {
              const match = result.match(/"id":"([0-9a-f-]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/);
              if (match) activeProjectId = match[1];
            }
          }

          // Track whether the model created its own log this turn
          if (fn.name === "create_log") {
            modelCreatedLog = true;
          }

          // Capture memory update from save_memory tool
          if (fn.name === "save_memory") {
            try {
              const parsed = JSON.parse(result) as { __memory_update__: string[]; replace: boolean };
              if (parsed.__memory_update__) {
                memoryUpdate = { facts: parsed.__memory_update__, replace: parsed.replace ?? false };
              }
            } catch { /* ignore parse errors */ }
          }

          history.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }
      }
    }

    return Response.json({ message: "Max iterations reached without a final response." });
  } catch (e) {
    console.error("[chat/route]", e);
    return Response.json({ message: "Error processing request." }, { status: 500 });
  }
}
