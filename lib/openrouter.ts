const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Free text-only models - kept up to date
const TEXT_MODELS = [
  "openrouter/free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "qwen/qwen3-coder:free",
];

function isUnsupportedModel(errMsg: string): boolean {
  return /image\.png|image input|multimodal|does not support/.test(errMsg);
}

async function callModel(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  model: string,
): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "HiPath",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText);
  }

  const data = await response.json();
  return data.choices[0].message.content;
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
  let lastError = "";

  for (const m of modelsToTry) {
    if (tried.has(m)) continue;
    tried.add(m);

    try {
      return await callModel(
        [{ role: "user", content: prompt }],
        systemPrompt,
        m
      );
    } catch (err: any) {
      lastError = err.message || "";
      if (isUnsupportedModel(lastError)) continue;
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
        if (isUnsupportedModel(errText)) continue;
        throw new Error(errText);
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
              // skip
            }
          }
        }
      }
      return;
    } catch {
      continue;
    }
  }

  try {
    const content = await callAI(prompt, systemPrompt);
    onToken(content);
  } catch {
    onToken("I'm having trouble connecting right now. Please try again.");
  }
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
