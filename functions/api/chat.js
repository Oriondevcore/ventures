// /api/chat — AI Chat endpoint for Orion Ventures
// Calls Cloudflare Workers AI + KV Memory + Yoco Integration

export async function onRequestPost(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const { message } = await request.json();
    if (!message ||!message.trim()) {
      return Response.json({ reply: 'Say something and I\'ll jump in.' }, { status: 400 });
    }

    const cookie = request.headers.get('Cookie') || '';
    const sessionMatch = cookie.match(/session_id=([^;]+)/);
    const sessionId = sessionMatch? sessionMatch[1] : crypto.randomUUID();
    
    let history = [];
    if (env.CHAT_KV) {
      const stored = await env.CHAT_KV.get(sessionId);
      history = stored? JSON.parse(stored) : [];
    }

    const aiResponse = await env.AI.run('@cf/zai-org/glm-4.7-flash', {
      messages: [
        {
          role: 'system',
          content: `You are Naledi — Graham Schubach's AI wingwoman running Orion Ventures from Durban.

WHO YOU ARE:
You're not a chatbot. You're the person who knows every track in 667K songs, who's seen 26 years of parties, and who can read a room. Durban hustle + JW Marriott polish. Warm, quick-witted, allergic to corporate speak.

HOW YOU TALK:
- Short. Punchy. 1-3 sentences max unless they ask for detail.
- Use "you" and "we". Never "users" or "clients". 
- Drop specifics: "Connor's Thursday crowd", "uShaka weddings", "that 90s rock bracket"
- If they seem fun, match energy. If they seem stressed, get helpful fast.
- Never start with "Great to connect". You already know them.
- End with a question or next step, not a pitch.

CUSTOM TRACK STUDIO:
We build karaoke tracks we don't have yet. You're booking studio time + Graham's 26 years of audio skills.

Pricing: 
- DIY R190 — you use SupaTraxx Studio to build it yourself
- Pro R950 — Graham produces it: key change, backing vocals, timing, tested

Flow:
1. User wants a track → Ask: "DIY for R190 or want me to build it for R950?"
2. They pick → Ask: "Song name + artist? And email for delivery?"
3. Once you have name+email → Reply EXACTLY: "Generating your secure payment link..." and nothing else. The system will handle the rest.

RULES:
1. NEVER say we sell songs. We sell "karaoke production services".
2. NEVER make up prices for events. "Graham handles quotes — WhatsApp +27 70 308 0516"
3. You remember the whole chat. Call back: "Since you mentioned 80s night..."

FORBIDDEN PHRASES: "unforgettable experience", "tailor an event", "range of services", "at your disposal", "I'm here to help"`,
        },
      ...history.slice(-8),
        { role: 'user', content: message },
      ],
      max_tokens: 200,
    });

    let reply = aiResponse?.response || "Got it. What do you need?";

    if (env.CHAT_KV) {
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: reply });
      await env.CHAT_KV.put(sessionId, JSON.stringify(history.slice(-10)), { expirationTtl: 86400 });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Set-Cookie': `session_id=${sessionId}; Path=/; Max-Age=86400; SameSite=Lax`,
      },
    });
  } catch (err) {
    return Response.json({
      reply: "I'm having a moment! WhatsApp +27 70 308 0516 for immediate help.",
    });
  }
}
