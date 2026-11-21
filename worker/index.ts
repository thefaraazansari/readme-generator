// Proxy: browser -> this Worker -> Gemini. Keeps GEMINI_API_KEY off the client.
export interface Env {
  GEMINI_API_KEY: string;
  ALLOWED_ORIGINS: string; // comma-separated
}

// Tried in order; moves on when a model is missing, rate limited or overloaded.
const MODELS = ["gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemma-4-26b-a4b-it", "gemma-4-31b-it"];
const RETRY_STATUS = new Set([404, 429, 500, 503]);
const MAX_PROMPT_CHARS = 200_000;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = env.ALLOWED_ORIGINS.split(",").includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": allowed ? origin : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });
    if (!allowed) {
      return new Response("Forbidden", { status: 403, headers: cors });
    }

    const { prompt } = (await request.json().catch(() => ({}))) as { prompt?: string };
    if (!prompt || prompt.length > MAX_PROMPT_CHARS) {
      return new Response("Missing or oversized prompt", { status: 400, headers: cors });
    }

    let upstream!: Response;
    let used = "";
    for (const model of MODELS) {
      upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );
      used = model;
      if (!RETRY_STATUS.has(upstream.status)) break;
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...cors,
        "Access-Control-Expose-Headers": "X-Model",
        "X-Model": used,
        "Content-Type": upstream.ok ? "text/event-stream" : "application/json",
      },
    });
  },
};
