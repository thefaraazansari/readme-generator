// Shared free key lives in the Cloudflare Worker; a person's own key goes straight to Google.
const WORKER_URL =
  import.meta.env.VITE_AI_WORKER_URL ?? "https://readme-ai.faraazfaizansari.workers.dev";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Keep in sync with worker/index.ts. Tried in order when a model is missing or busy.
const MODELS = ["gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemma-4-26b-a4b-it", "gemma-4-31b-it"];
const RETRY_STATUS = new Set([404, 429, 500, 503]);

function errorFor(status: number, ownKey: boolean): Error {
  if (status === 429 || status === 503 || status === 404) {
    return new Error(
      ownKey
        ? "Gemini is busy or your key's free quota is used up. Try again in a minute."
        : "The shared free AI quota is used up or busy. Add your own free Gemini key in the AI Summary tab, or try again later.",
    );
  }
  if (ownKey && (status === 400 || status === 401 || status === 403)) {
    return new Error("Google rejected the Gemini key. Check that it's copied correctly.");
  }
  if (status === 403) return new Error("The AI service doesn't allow requests from this site.");
  return new Error(`AI request failed (${status}).`);
}

/** The model failed after the response had already started (HTTP 200 with an error event inside). */
class MidStreamError extends Error {}

/** Pull the visible answer out of one SSE chunk, skipping the model's "thought" parts. */
function textOf(data: string): string {
  let event;
  try {
    event = JSON.parse(data);
  } catch {
    return "";
  }
  if (event?.error) {
    throw new MidStreamError("The AI model got overloaded while writing. Try again in a moment.");
  }
  const parts = event?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((p: { thought?: boolean }) => !p.thought)
    .map((p: { text?: string }) => p.text ?? "")
    .join("");
}

/**
 * Stream an answer for `prompt`, calling `onText` with the full text so far.
 * Uses the shared Worker, or Gemini directly when `apiKey` is given.
 * Starts over once if the model fails halfway through.
 */
export async function streamAi(
  prompt: string,
  options: { apiKey?: string; signal?: AbortSignal; onText: (text: string) => void },
): Promise<void> {
  try {
    await streamOnce(prompt, options);
  } catch (err) {
    if (!(err instanceof MidStreamError)) throw err;
    options.onText("");
    await streamOnce(prompt, options);
  }
}

async function streamOnce(
  prompt: string,
  { apiKey = "", signal, onText }: { apiKey?: string; signal?: AbortSignal; onText: (text: string) => void },
): Promise<void> {
  let res: Response | undefined;

  if (apiKey) {
    for (const model of MODELS) {
      res = await fetch(`${GEMINI_URL}/${model}:streamGenerateContent?alt=sse`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal,
      });
      if (!RETRY_STATUS.has(res.status)) break;
    }
  } else {
    res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal,
    });
  }

  if (!res?.ok || !res.body) throw errorFor(res?.status ?? 0, Boolean(apiKey));

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      text += textOf(line.slice(5).trim());
      onText(text);
    }
  }
  // The last event may arrive without a trailing newline.
  if (buffer.startsWith("data:")) {
    text += textOf(buffer.slice(5).trim());
    onText(text);
  }
  if (!text.trim()) throw new Error("The AI returned an empty answer. Try again.");
}
