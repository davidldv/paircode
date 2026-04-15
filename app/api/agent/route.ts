import { NextRequest } from "next/server";

export const runtime = "nodejs";

type AgentMode = "answer" | "summarize" | "next-steps";

type AgentRequest = {
  mode?: AgentMode;
  question?: string;
  context?: {
    selectedFiles?: string;
    pinnedRequirements?: string;
  };
  messages?: Array<{ userName?: string; text?: string; timestamp?: string }>;
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";

function buildPrompt(body: AgentRequest) {
  const mode = body.mode ?? "answer";
  const question = body.question ?? "";
  const context = body.context ?? {};
  const messages = body.messages ?? [];

  return [
    `Mode: ${mode}`,
    `Question: ${question || "(none)"}`,
    "",
    "Selected files/snippets:",
    context.selectedFiles || "(none)",
    "",
    "Pinned requirements:",
    context.pinnedRequirements || "(none)",
    "",
    "Recent chat history (JSON):",
    JSON.stringify(messages.slice(-25), null, 2),
    "",
    "Provide practical pair-programming guidance for a team.",
  ].join("\n");
}

function fallback(body: AgentRequest) {
  const mode = body.mode ?? "answer";
  if (mode === "summarize") {
    return "Summary:\n- Team is collaborating in real time.\n- Use the shared context to align work.\n- Keep messages concise and implementation-focused.";
  }
  if (mode === "next-steps") {
    return "Next steps:\n1. Confirm API events and payloads.\n2. Implement one end-to-end room flow.\n3. Add edge-case handling and verification.\n4. Validate with lint/tests.";
  }
  return "Recommendation:\nStart from the highest-risk integration point, then ship an incremental vertical slice with full observability and clear contracts.";
}

async function* streamOpenAI(prompt: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      stream: true,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are a collaborative room AI pair programmer. Provide concise and practical guidance with concrete steps. VERY IMPORTANT: Do NOT use markdown formatting, asterisks, bold, italics, headers, or any markdown syntax. Output plain text only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "Unknown AI error");
    throw new Error(`OpenAI error: ${response.status} ${text}`);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  const reader = response.body.getReader();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      const parsed = JSON.parse(raw) as { choices?: Array<{ delta?: { content?: string } }> };
      const token = parsed.choices?.[0]?.delta?.content;
      if (token) {
        yield token;
      }
    }
  }
}

async function* streamGemini(prompt: string) {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      stream: true,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are a collaborative room AI pair programmer. Provide concise and practical guidance with concrete steps. VERY IMPORTANT: Do NOT use markdown formatting, asterisks, bold, italics, headers, or any markdown syntax. Output plain text only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "Unknown AI error");
    throw new Error(`Gemini error: ${response.status} ${text}`);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  const reader = response.body.getReader();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      const parsed = JSON.parse(raw) as { choices?: Array<{ delta?: { content?: string } }> };
      const token = parsed.choices?.[0]?.delta?.content;
      if (token) {
        yield token;
      }
    }
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AgentRequest;
  const prompt = buildPrompt(body);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const provider = GEMINI_API_KEY ? "gemini" : OPENAI_API_KEY ? "openai" : "fallback";
        emit("start", { ok: true, mode: body.mode ?? "answer", provider });

        if (GEMINI_API_KEY) {
          for await (const token of streamGemini(prompt)) {
            emit("token", { token });
          }

          emit("done", { ok: true });
          controller.close();
          return;
        }

        if (OPENAI_API_KEY) {
          for await (const token of streamOpenAI(prompt)) {
            emit("token", { token });
          }

          emit("done", { ok: true });
          controller.close();
          return;
        }

        {
          const text = fallback(body);
          for (const token of text.split(/(\s+)/).filter(Boolean)) {
            emit("token", { token });
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          emit("done", { ok: true });
          controller.close();
        }
      } catch (error) {
        emit("error", {
          message: error instanceof Error ? error.message : "Unknown AI error",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
