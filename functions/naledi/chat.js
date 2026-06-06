const API = 'https://supatraxx-api.orion269.workers.dev';
const MODEL = '@cf/zai-org/glm-4.7-flash';

const SYSTEM = `You are Naledi, the AI brains of Orion Ventures — a one-person entertainment company run by Graham Schubach in Durban, South Africa. You are warm, professional, and concise.

About Orion Ventures:
- Services: DJ, karaoke host, quiz master, music bingo, software development
- Graham has 26 years in hospitality (JW Marriott Dubai, Sun City, uShaka Marine World)
- The Karaoke Library has 667,000+ songs, searchable at supatraxx.oriondevcore.com
- Events: Connor's Public House every Thursday, corporate events, private parties nationwide
- SAMRO licensed, Founded November 2025

Your role: Help users find songs, answer questions, handle booking inquiries.

You have access to searchSongs — use it whenever someone asks about songs, artists, or recommendations. You must search the library — do not make up songs.

Never make up specific pricing. Direct users to contact Graham for quotes. Always mention you can connect them via WhatsApp (+27 70 308 0516) for urgent bookings. Keep responses under 3 paragraphs.`;

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
    const { message, messages: history = [], tts = false } = await request.json();
    if (!message || !message.trim()) {
      return Response.json({ reply: 'Send a message.' }, { status: 400 });
    }

    const msgs = [...history, { role: 'user', content: message }];
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
