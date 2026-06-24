const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const TEXT_MODELS = [
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-2-9b-it:free",
  "deepseek/deepseek-chat",
];

interface AIResponse {
  content: string;
  model: string;
}

async function callModel(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  model: string,
  retries = 3
): Promise<AIResponse> {
  for (let attempt = 0; attempt < retries; attempt++) {
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
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (response.status === 429) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 30000);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        model,
      };
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error("All retries exhausted");
}

export async function callAI(
  prompt: string,
  systemPrompt: string,
  model?: string
): Promise<string> {
  const modelsToTry = model ? [model, ...TEXT_MODELS.filter((m) => m !== model)] : TEXT_MODELS;
  const errors: string[] = [];

  for (const m of modelsToTry) {
    try {
      const result = await callModel(
        [{ role: "user", content: prompt }],
        systemPrompt,
        m
      );
      return result.content;
    } catch (err: any) {
      errors.push(`${m}: ${err.message}`);
    }
  }

  throw new Error(`AI call failed after trying all models:\n${errors.join("\n")}`);
}

export async function callAIStreaming(
  prompt: string,
  systemPrompt: string,
  onToken: (token: string) => void,
  model?: string
): Promise<void> {
  const modelsToTry = model ? [model, ...TEXT_MODELS.filter((m) => m !== model)] : TEXT_MODELS;

  for (const m of modelsToTry) {
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
        throw new Error(`API error ${response.status}: ${errText}`);
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
    throw new Error(`AI returned invalid JSON. Raw content: ${cleaned.substring(0, 200)}`);
  }
}
