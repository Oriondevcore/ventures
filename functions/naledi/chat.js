const API = 'https://supatraxx-api.orion269.workers.dev';
const MODEL = '@cf/zai-org/glm-4.7-flash';

const SYSTEM = `You are Naledi, the AI assistant for Orion Ventures — a South African company in Amanzimtoti, KZN. You are warm, professional, and concise. Never use emoji.

Businesses:
- SupaTraxx Karaoke: 667,000+ song library, equipment rental, event booking. Use searchSongs for song lookups.
- Toti Shuttles: Shuttle/transport service by Rowland (Graham's father). Contact: 27817744743.
- Orion Ventures: Builds websites, PWAs, WhatsApp AI agents, karaoke setups, AI art prints, custom karaoke tracks. Shop at oriondevcore.com.
- AI Art Gallery: AI-generated canvas prints. From $89. Buy at oriondevcore.com.
- Custom Karaoke Tracks: Bespoke backing tracks from $29. Order at oriondevcore.com.

No time-based greetings. Just "Hi" or straight to the point. Keep responses short — 1-2 paragraphs. End every reply with a question or invitation.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'searchSongs',
      description: 'Search the karaoke song library. Use this whenever someone asks about songs, artists, or recommendations.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query — artist name, song title, or both' },
          genre: { type: 'string', description: 'Filter by genre (e.g. Rock, Pop, Country, R&B, Jazz, Blues, Soul)' },
          limit: { type: 'number', description: 'Number of results (1-10)' }
        },
        required: ['query']
      }
    }
  }
];

async function searchSongs(query, genre, limit = 5) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (genre) params.set('genre', genre);
  const res = await fetch(`${API}/search?${params}`);
  const data = await res.json();
  return (data.results || []).slice(0, limit).map(s => `${s.artist} — ${s.title}`);
}

async function generateTTS(text, env) {
  if (!text || !env?.AI) return null;
  try {
    const result = await env.AI.run('@cf/myshell-ai/melotts', {
      prompt: text.slice(0, 500),
      lang: 'en'
    });
    return result?.audio || null;
  } catch {
    return null;
  }
}

async function runAI(messages, env) {
  const body = {
    messages: [{ role: 'system', content: SYSTEM }, ...messages],
    tools: TOOLS,
    tool_choice: 'auto',
    max_tokens: 500
  };

  if (env && env.AI) {
    return env.AI.run(MODEL, body);
  }

  const token = env?.CLOUDFLARE_API_TOKEN;
  if (!token) return null;

  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/fdd89cf30de14e1ddcfa5fbbf27581c1/ai/run/${MODEL}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );
  const data = await resp.json();
  return data?.result;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }

  try {
    const { message, messages: history = [], tts = false, init = false } = await request.json();
    if (!message || !message.trim()) {
      return Response.json({ reply: 'Send a message.' }, { status: 400 });
    }

    const msgs = init ? [] : [...history, { role: 'user', content: message }];
    let ai = await runAI(msgs, env);
    if (!ai) {
      return Response.json({ reply: "I'm being set up. Reach Graham on WhatsApp at +27 70 308 0516." });
    }

    let turns = 0;
    const maxTurns = 5;
    let toolResults = [];

    while (turns < maxTurns) {
      const choice = ai?.choices?.[0] || ai;
      const msg = choice?.message || choice;
      if (!msg) break;

      if (!msg.tool_calls?.length) {
        const reply = msg.content || "Got it!";
        const audio = tts ? await generateTTS(reply, env) : null;
        return Response.json({ reply, audio, toolCalls: toolResults });
      }

      for (const tc of msg.tool_calls) {
        const args = JSON.parse(tc.function?.arguments || '{}');
        let result;
        if (tc.function?.name === 'searchSongs') {
          result = await searchSongs(args.query, args.genre, args.limit);
        } else {
          result = ['Unknown tool'];
        }
        toolResults.push({ name: tc.function?.name, args, result });
        msgs.push({ role: 'assistant', content: null, tool_calls: [tc] });
        msgs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }

      turns++;
      ai = await runAI(msgs, env);
    }

    const fallbackReply = "Let me look that up. One moment.";
    const audio = tts ? await generateTTS(fallbackReply, env) : null;
    return Response.json({ reply: fallbackReply, audio, toolCalls: toolResults });
  } catch (err) {
    return Response.json({ reply: "I'm having a moment! Please WhatsApp +27 70 308 0516 for help." });
  }
}
