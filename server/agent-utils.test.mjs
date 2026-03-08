import { describe, expect, it } from "bun:test";

import {
  buildAgentPrompt,
  buildFallbackResponse,
  parseSseLine,
  streamTokensFromSseStream,
} from "./agent-utils.mjs";

function createSnapshot() {
  return {
    messages: [
      {
        userName: "Alex",
        text: "We should split the room hook next.",
        timestamp: "2026-03-07T10:00:00.000Z",
      },
    ],
    context: {
      selectedFiles: "app/page.tsx\nlib/use-paircode-room.ts",
      pinnedRequirements: "Use Bun for scripts.",
    },
  };
}

describe("agent utils", () => {
  it("builds fallback next steps with pinned context", () => {
    const text = buildFallbackResponse("next-steps", createSnapshot(), "");

    expect(text).toContain("Proposed next steps:");
    expect(text).toContain("Use Bun for scripts.");
  });

  it("parses SSE payload lines and ignores invalid lines", () => {
    expect(parseSseLine("event: ping")).toBeNull();
    expect(parseSseLine("data: [DONE]")).toBe("[DONE]");
    expect(parseSseLine('data: {"choices":[{"delta":{"content":"Hi"}}]}')).toEqual({
      choices: [{ delta: { content: "Hi" } }],
    });
  });

  it("streams token content from an SSE stream", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n'));
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":" world"}}]}\n'));
        controller.enqueue(encoder.encode("data: [DONE]\n"));
        controller.close();
      },
    });

    const tokens = [];
    for await (const token of streamTokensFromSseStream(stream)) {
      tokens.push(token);
    }

    expect(tokens).toEqual(["Hello", " world"]);
  });

  it("builds an agent prompt from room context and messages", () => {
    const prompt = buildAgentPrompt({
      mode: "answer",
      question: "What should we refactor next?",
      roomSnapshot: createSnapshot(),
    });

    expect(prompt).toContain("Mode: answer");
    expect(prompt).toContain("What should we refactor next?");
    expect(prompt).toContain("lib/use-paircode-room.ts");
  });
});