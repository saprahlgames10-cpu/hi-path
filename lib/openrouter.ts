const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const TEXT_MODELS = [
  "microsoft/phi-3-mini-4k-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-2-2b-it:free",
];

interface AIResponse {
  content: string;
  model: string;
}

function isImageError(msg: string): boolean {
  return msg.includes("image.png") || msg.includes("image input") || msg.includes("multimodal");
}

async function callModel(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  model: string,
): Promise<AIResponse> {
  const body = JSON.stringify({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "HiPath",
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const err = new Error(`[${model}] ${response.status}: ${errorText}`);
    (err as any).model = model;
    (err as any).errorText = errorText;
    throw err;
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model,
  };
}

export async function callAI(
  prompt: string,
  systemPrompt: string,
  model?: string
): Promise<string> {
  const modelsToTry = model
    ? [model, ...TEXT_MODELS.filter((m) => m !== model)]
    : TEXT_MODELS;

  const tried = new Set<string>();

  for (const m of modelsToTry) {
    if (tried.has(m)) continue;
    tried.add(m);

    try {
      const result = await callModel(
        [{ role: "user", content: prompt }],
        systemPrompt,
        m
      );
      return result.content;
    } catch (err: any) {
      if (isImageError(err.message || "")) {
        continue;
      }
      console.warn(`OpenRouter model ${m} failed:`, err.message);
    }
  }

  throw new Error("AI service unavailable. Please try again later.");
}

export async function callAIStreaming(
  prompt: string,
  systemPrompt: string,
  onToken: (token: string) => void,
  model?: string
): Promise<void> {
  const modelsToTry = model
    ? [model, ...TEXT_MODELS.filter((m) => m !== model)]
    : TEXT_MODELS;

  const tried = new Set<string>();

  for (const m of modelsToTry) {
    if (tried.has(m)) continue;
    tried.add(m);

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "HiPath",
        },
        body: JSON.stringify({
          model: m,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        if (isImageError(errText)) continue;
        throw new Error(`${m}: ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") return;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content || "";
              if (token) onToken(token);
            } catch {
              // skip parse errors
            }
          }
        }
      }
      return;
    } catch {
      continue;
    }
  }

  const content = await callAI(prompt, systemPrompt);
  onToken(content);
}

export async function parseJSONFromAI<T>(
  prompt: string,
  systemPrompt: string
): Promise<T> {
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
