export function buildFallbackResponse(mode, roomSnapshot, question) {
  const latestMessages = roomSnapshot.messages.slice(-6);
  const contextLines = [
    roomSnapshot.context.selectedFiles?.trim(),
    roomSnapshot.context.pinnedRequirements?.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  if (mode === "summarize") {
    return [
      "Room summary:",
      latestMessages.length
        ? latestMessages.map((message) => `- ${message.userName}: ${message.text}`).join("\n")
        : "- No chat history yet.",
      contextLines ? `\nPinned context:\n${contextLines}` : "",
    ].join("\n");
  }

  if (mode === "next-steps") {
    return [
      "Proposed next steps:",
      "1. Clarify the core requirement in one sentence.",
      "2. Split work into frontend, backend, and tests.",
      "3. Implement the smallest complete slice first.",
      "4. Validate with lint/tests and tighten edge cases.",
      contextLines ? `\nUse this room context while implementing:\n${contextLines}` : "",
    ].join("\n");
  }

  return [
    "Pair-agent suggestion:",
    question ? `Question: ${question}` : "No explicit question was provided.",
    "",
    "Suggested approach:",
    "- Start with an API contract and shared types.",
    "- Implement real-time events first, then persistence.",
    "- Add clear error states and loading indicators.",
    contextLines ? `\nContext to keep in scope:\n${contextLines}` : "",
  ].join("\n");
}

export function parseSseLine(line) {
  if (!line.startsWith("data:")) return null;
  const jsonText = line.slice(5).trim();
  if (!jsonText || jsonText === "[DONE]") return "[DONE]";
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

export async function* streamTokensFromSseStream(stream) {
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const parsed = parseSseLine(line.trim());
      if (!parsed || parsed === "[DONE]") continue;
      const token = parsed.choices?.[0]?.delta?.content;
      if (token) {
        yield token;
      }
    }
  }
}

export function buildAgentPrompt({ mode, question, roomSnapshot }) {
  const shortMessages = roomSnapshot.messages.slice(-25).map((message) => ({
    user: message.userName,
    text: message.text,
    at: message.timestamp,
  }));

  return [
    `Mode: ${mode}`,
    question ? `Question: ${question}` : "Question: (none)",
    "",
    "Shared context:",
    roomSnapshot.context.selectedFiles || "(no selected files/snippets)",
    "",
    "Pinned requirements:",
    roomSnapshot.context.pinnedRequirements || "(none)",
    "",
    "Recent room messages (JSON):",
    JSON.stringify(shortMessages, null, 2),
    "",
    "Respond for a team in a real-time pair programming room.",
    "If mode is summarize, provide a concise summary.",
    "If mode is next-steps, provide an ordered implementation plan.",
    "If mode is answer, directly answer the question and include practical coding guidance.",
  ].join("\n");
}