import "server-only";
import { env } from "@/lib/env";

// Client minimal pour tout serveur compatible "OpenAI chat completions" :
// Scaleway Generative APIs, OVHcloud AI Endpoints, vLLM, Ollama, Mistral...
// Changer d'hébergeur = changer LLM_BASE_URL, LLM_API_KEY et LLM_MODEL.

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type CallOptions = {
  fast?: boolean;
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
};

export class LlmError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

function model(fast?: boolean) {
  return (fast && process.env.LLM_MODEL_FAST) || env("LLM_MODEL");
}

async function post(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
  const base = env("LLM_BASE_URL").replace(/\/$/, "");
  return fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env("LLM_API_KEY")}`,
    },
    body: JSON.stringify(body),
    signal,
  });
}

function buildBody(messages: ChatMessage[], o: CallOptions, stream: boolean) {
  const body: Record<string, unknown> = {
    model: model(o.fast),
    messages,
    max_tokens: o.maxTokens ?? 3000,
    temperature: o.temperature ?? 0.3,
    stream,
  };
  if (o.json && process.env.LLM_JSON_MODE !== "false") body.response_format = { type: "json_object" };
  return body;
}

async function ensureOk(res: Response) {
  if (res.ok) return;
  const text = await res.text().catch(() => "");
  console.error("LLM error", res.status, text.slice(0, 500));
  if (res.status === 429) throw new LlmError("Le service d'IA est très demandé. Réessaie dans une minute.", 429);
  throw new LlmError("Le service d'IA n'a pas répondu correctement. Réessaie.", 502);
}

// Réponse complète, en une fois.
export async function chat(messages: ChatMessage[], o: CallOptions = {}): Promise<string> {
  let res = await post(buildBody(messages, o, false), o.signal);
  // Certains serveurs refusent response_format : on réessaie sans.
  if (!res.ok && res.status === 400 && o.json) {
    res = await post(buildBody(messages, { ...o, json: false }, false), o.signal);
  }
  await ensureOk(res);
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new LlmError("Le modèle a renvoyé une réponse vide. Réessaie.");
  return text;
}

// Réponse en continu (pour afficher la fiche pendant qu'elle s'écrit).
export async function chatStream(messages: ChatMessage[], o: CallOptions = {}): Promise<AsyncGenerator<string>> {
  const res = await post(buildBody(messages, o, true), o.signal);
  await ensureOk(res);
  if (!res.body) throw new LlmError("Flux de réponse indisponible.");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  async function* gen() {
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const l = line.trim();
        if (!l.startsWith("data:")) continue;
        const payload = l.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
          if (delta) yield delta as string;
        } catch {
          // ligne incomplète ou commentaire : ignorée
        }
      }
    }
  }
  return gen();
}

// Lit un JSON même entouré de texte ou de ```json.
export function parseJsonLoose(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidates = [text, fence?.[1]];
  const first = Math.min(...["{", "["].map((c) => text.indexOf(c)).filter((i) => i >= 0));
  const last = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (Number.isFinite(first) && last > first) candidates.push(text.slice(first, last + 1));
  for (const c of candidates) {
    if (!c) continue;
    try {
      return JSON.parse(c.trim());
    } catch {
      /* suivant */
    }
  }
  throw new LlmError("Réponse illisible.");
}
