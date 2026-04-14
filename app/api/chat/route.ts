import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { tools, executeTool } from "@/lib/chat/tools";
import { getSystemPrompt } from "@/lib/chat/system-prompt";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ChatCompletionMessageParam[] };

    const history: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: getSystemPrompt(new Date().toISOString().split("T")[0]),
      },
      ...messages,
    ];

    // Tool-calling loop — max 20 iterations (allows projects with many steps + log)
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
        return Response.json({ message: choice.message.content ?? "" });
      }

      if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fn = (toolCall as any).function as { name: string; arguments: string };
          const args = JSON.parse(fn.arguments) as Record<string, unknown>;
          const result = await executeTool(fn.name, args);
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
