import OpenAI from 'openai';

let client: OpenAI | null = null;

export function llm(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL;
    if (!apiKey) throw new Error('OPENAI_API_KEY missing');
    client = new OpenAI({ apiKey, baseURL });
  }
  return client;
}

export const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'openai/gpt-4o-mini';

// Ordered fallback chain. If the primary model is unavailable on the user's
// TokenRouter distribution group, we try each of these in order.
// NOTE: TokenRouter expects `provider/model` form — unprefixed names 503.
const FALLBACK_MODELS = (process.env.OPENAI_FALLBACK_MODELS ||
  'openai/gpt-4o-mini,anthropic/claude-haiku-4.5,deepseek/deepseek-v3.2,google/gemini-3-flash-preview,qwen/qwen3.6-plus,x-ai/grok-4.1-fast,nvidia/llama-3.1-nemotron-ultra-253b-v1')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isModelUnavailable(err: any): boolean {
  const msg = String(err?.message || err?.error?.message || '').toLowerCase();
  return (
    err?.status === 404 ||
    err?.status === 503 ||
    msg.includes('no available channel') ||
    msg.includes('model') && msg.includes('not found') ||
    msg.includes('unknown model') ||
    msg.includes('unsupported model')
  );
}

export async function chat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  opts: { model?: string; temperature?: number; max_tokens?: number } = {}
): Promise<string> {
  const tried = new Set<string>();
  const chain = [opts.model ?? DEFAULT_MODEL, ...FALLBACK_MODELS];

  let lastErr: unknown = null;
  for (const model of chain) {
    if (!model || tried.has(model)) continue;
    tried.add(model);
    try {
      const res = await llm().chat.completions.create({
        model,
        temperature: opts.temperature ?? 0.8,
        max_tokens: opts.max_tokens ?? 400,
        messages,
      });
      const msg = res.choices[0]?.message as any;
      // Some thinking models return content='' with reasoning_content; fall back if empty.
      return msg?.content || msg?.reasoning_content || '';
    } catch (err) {
      lastErr = err;
      if (isModelUnavailable(err)) continue; // try next in chain
      throw err; // real error (auth, rate limit, etc) — bubble up
    }
  }
  throw lastErr ?? new Error('No available model in fallback chain');
}

export async function embed(text: string): Promise<number[] | null> {
  const model = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
  try {
    const res = await llm().embeddings.create({ model, input: text });
    return res.data[0]?.embedding ?? null;
  } catch {
    return null; // embeddings may not be available on all TokenRouter groups; callers handle null
  }
}
