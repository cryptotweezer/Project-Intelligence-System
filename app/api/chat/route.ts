import { createServerClient } from "@supabase/ssr";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { tools, executeTool } from "@/lib/chat/tools";
import { getSystemPrompt } from "@/lib/chat/system-prompt";
import { supabaseAdmin } from "@/lib/supabase/admin";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DASH_LIMIT = 20;

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

    const isOwner = user.email === process.env.OWNER_EMAIL;
    const userName: string | null = isOwner
      ? (user.user_metadata?.full_name || user.user_metadata?.name || "Andres")
      : (user.user_metadata?.full_name || user.user_metadata?.name || null);

    // ── Guest limits ────────────────────────────────────────────────────────
    if (!isOwner) {
      // Upsert guest_limits row on first visit
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

    // ── Tool-calling loop ───────────────────────────────────────────────────
    const { messages } = (await req.json()) as { messages: ChatCompletionMessageParam[] };
    const context = { userId: user.id, isOwner };

    const history: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: getSystemPrompt(new Date().toISOString().split("T")[0], userName, isOwner),
      },
      ...messages,
    ];

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

        // Increment guest message count on successful completion
        if (!isOwner) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabaseAdmin as any).rpc("increment_dash_messages", { p_user_id: user.id });
        }

        return Response.json({ message: finalMessage });
      }

      if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fn = (toolCall as any).function as { name: string; arguments: string };
          const args = JSON.parse(fn.arguments) as Record<string, unknown>;
          const result = await executeTool(fn.name, args, context);
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
