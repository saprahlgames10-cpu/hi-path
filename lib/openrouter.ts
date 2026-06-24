const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const PRIMARY_MODEL = "deepseek/deepseek-chat";
const FALLBACK_MODEL = "mistralai/mistral-7b-instruct:free";

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
  try {
    const result = await callModel(
      [{ role: "user", content: prompt }],
      systemPrompt,
      model || PRIMARY_MODEL
    );
    return result.content;
  } catch (primaryError) {
    try {
      const result = await callModel(
        [{ role: "user", content: prompt }],
        systemPrompt,
        FALLBACK_MODEL
      );
      return result.content;
    } catch (fallbackError) {
      throw new Error(`AI call failed: ${primaryError}. Fallback also failed: ${fallbackError}`);
    }
  }
}

export async function callAIStreaming(
  prompt: string,
  systemPrompt: string,
  onToken: (token: string) => void,
  model?: string
): Promise<void> {
  const selectedModel = model || PRIMARY_MODEL;
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
        model: selectedModel,
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
      throw new Error(`API error: ${response.status}`);
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
  } catch (error) {
    // Try fallback model non-streaming
    const content = await callAI(prompt, systemPrompt, FALLBACK_MODEL);
    onToken(content);
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
    throw new Error(`AI returned invalid JSON. Raw content: ${cleaned.substring(0, 200)}`);
  }
}
