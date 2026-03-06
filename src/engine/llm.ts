import Anthropic from "@anthropic-ai/sdk";

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export async function callClaude(systemPrompt: string, userContent: string, apiKey: string): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new LLMError("Unexpected response type from Claude");
  return block.text;
}

/** Extract the first JSON object or array from a string that may contain prose. */
export function extractJson(text: string): string {
  const start = text.search(/[\[{]/);
  if (start === -1) throw new LLMError("No JSON found in response");
  // Find the last } or ] and try progressively shorter slices until JSON.parse succeeds.
  // This correctly handles braces/brackets inside string values.
  const trimmed = text.slice(start).trimEnd();
  // Try the whole thing first (common case: clean response)
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // Walk backwards from the end to find a valid JSON boundary
    for (let end = trimmed.length - 1; end > 0; end--) {
      const ch = trimmed[end];
      if (ch !== "}" && ch !== "]") continue;
      const candidate = trimmed.slice(0, end + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        // keep walking back
      }
    }
  }
  throw new LLMError("No valid JSON object found in response");
}
