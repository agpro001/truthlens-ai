// Shared Gemini API helper using user's GEMINI_API_KEY
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

type Part = { text?: string; inline_data?: { mime_type: string; data: string } };

export interface GeminiCallOptions {
  model?: string;
  systemInstruction?: string;
  parts: Part[];
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
}

export function getGeminiKey(): string {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

export async function callGemini(opts: GeminiCallOptions): Promise<string> {
  const model = opts.model ?? "gemini-2.5-flash";
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${getGeminiKey()}`;
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: opts.parts }],
    generationConfig: {
      temperature: opts.temperature ?? 0.3,
      maxOutputTokens: opts.maxOutputTokens ?? 2048,
      ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini error", res.status, errText);
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 403) throw new Error("QUOTA_OR_KEY");
    throw new Error(`Gemini API failed: ${res.status}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: Part) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}

// Streaming SSE that emits OpenAI-compatible chunks for client compat
export async function streamGeminiAsOpenAI(opts: {
  model?: string;
  systemInstruction?: string;
  contents: { role: "user" | "model"; parts: Part[] }[];
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<Response> {
  const model = opts.model ?? "gemini-2.5-flash";
  const url = `${GEMINI_BASE}/${model}:streamGenerateContent?alt=sse&key=${getGeminiKey()}`;
  const body: Record<string, unknown> = {
    contents: opts.contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
    },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    console.error("Gemini stream error", upstream.status, errText);
    return new Response(JSON.stringify({ error: `Gemini ${upstream.status}` }), {
      status: upstream.status,
    });
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const text =
                parsed.candidates?.[0]?.content?.parts?.map((p: Part) => p.text ?? "").join("") ?? "";
              if (text) {
                const chunk = {
                  choices: [{ delta: { content: text } }],
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch (_e) {
              // ignore partial chunks
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("stream pump error", e);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
