const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const MODEL = "claude-sonnet-4-20250514";

async function callModel(messages: { role: string; content: string }[], systemPrompt: string): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  try {
    return await callModel([{ role: "user", content: prompt }], systemPrompt);
  } catch (err: any) {
    if (err.message?.includes("credit balance is too low") || err.message?.includes("401")) {
      throw new Error("AI service unavailable. Please check your API key or add credits.");
    }
    throw new Error(`AI service error: ${err.message}`);
  }
}

export async function parseJSONFromAI<T>(prompt: string, systemPrompt: string): Promise<T> {
  const content = await callAI(prompt, systemPrompt);
  const cleaned = content
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`AI returned invalid JSON. First 200 chars: ${cleaned.substring(0, 200)}`);
  }
}
