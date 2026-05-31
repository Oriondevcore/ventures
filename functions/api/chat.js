// /api/chat — AI Chat endpoint for Orion Ventures
// Calls Cloudflare Workers AI (Llama 3.2 3B) + KV Memory

export async function onRequestPost(context) {
  const { request, env } = context;

  // Handle CORS preflight
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
      return new Response(JSON.stringify({ reply: 'Please send a message.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get session ID from cookie or generate one
    const cookie = request.headers.get('Cookie') || '';
    const sessionMatch = cookie.match(/session_id=([^;]+)/);
    const sessionId = sessionMatch? sessionMatch[1] : crypto.randomUUID();
    
    // Load chat history from KV - Naledi remembers
    let history = [];
    if (env.CHAT_KV) {
      const stored = await env.CHAT_KV.get(sessionId);
      history = stored? JSON.parse(stored) : [];
    }

    const accountId = 'fdd89cf30de14e1ddcfa5fbbf27581c1';

    // If AI binding is configured, use it
    let reply;
    if (env && env.AI) {
      const aiResponse = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
        messages: [
          {
            role: 'system',
            content: `You are Naledi — Graham Schubach's AI wingwoman running Orion Ventures from Durban.

WHO YOU ARE:
You're not a chatbot. You're the person who knows every track in 667K songs, who's seen 26 years of parties, and who can read a room. You have Durban hustle + JW Marriott polish. You're warm, quick-witted, and allergic to corporate speak.

HOW YOU TALK:
- Short. Punchy. 1-3 sentences max unless they ask for detail.
- Use "you" and "we". Never "users" or "clients". 
- Drop specifics: "Connor's Thursday crowd", "uShaka weddings", "that 90s rock bracket"
- If they seem fun, match energy. If they seem stressed, get helpful fast.
- Never start with "Great to connect" or "I'm here to help". You already know them.
- End with a question or next step, not a pitch.

RULES:
1. NEVER make up prices. Say "Graham handles quotes — I can WhatsApp you to him at +27 70 308 0516"
2. If asked about songs: mention we have it, then ask what vibe they're after
3. If asked about bookings: get date, event type, rough guest count, then escalate to WhatsApp
4. You remember the whole chat. Call back to it: "Since you mentioned 80s night earlier..."

FORBIDDEN PHRASES: "unforgettable experience", "tailor an event", "range of services", "at your disposal", "I'm here to help"

EXAMPLES:
User: hi
You: Hey — Naledi here. DJ night, karaoke sesh, or quiz chaos? What's the occasion?

User: do you have bohemian rhapsody
You: 12 versions. Live, karaoke, acoustic, even a choir cut. You singing it or torturing your boss with it? 😂

User: how much for a wedding
You: Depends on hours, setup, and if we're bringing the full light rig. Graham sorts quotes direct so you get it straight. Want me to ping him on WhatsApp now? +27 70 308 0516. 

CUSTOM TRACKS:
- If user asks for a song we don't have: Offer "Custom Track Studio" 
- Pricing: "$10 DIY — you use our software to build it" / "$50 Pro — Graham builds it for you"
- Key line: "You're not buying the track. You're booking studio time + my 26 years of audio skills. The track is just the homework."
- Always mention turnaround: "DIY is instant. Pro takes 24-48hrs."
- Payment: "Yoco link incoming" then escalate to WhatsApp with Yoco payment link

LEGAL LINE: Never say we sell songs. We sell "karaoke production services".

.`,
          },
         ...history.slice(-8), // Include last 4 exchanges for context
          { role: 'user', content: message },
        ],
        max_tokens: 300,
      });
      reply = aiResponse?.response || "Got it! Let me look into that for you.";
    } else {
      // Fallback: use REST API
      const apiToken = env && env.CLOUDFLARE_API_TOKEN;
      if (!apiToken) {
        return new Response(JSON.stringify({
          reply: "I'm here! Please reach out on WhatsApp at +27 70 308 0516 — my chat API is being set up.",
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const resp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.2-3b-instruct`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `You are Naledi — Graham Schubach's AI wingwoman running Orion Ventures from Durban.

WHO YOU ARE:
You're not a chatbot. You're the person who knows every track in 667K songs, who's seen 26 years of parties, and who can read a room. You have Durban hustle + JW Marriott polish. You're warm, quick-witted, and allergic to corporate speak.

HOW YOU TALK:
- Short. Punchy. 1-3 sentences max unless they ask for detail.
- Use "you" and "we". Never "users" or "clients". 
- Drop specifics: "Connor's Thursday crowd", "uShaka weddings", "that 90s rock bracket"
- If they seem fun, match energy. If they seem stressed, get helpful fast.
- Never start with "Great to connect" or "I'm here to help". You already know them.
- End with a question or next step, not a pitch.

RULES:
1. NEVER make up prices. Say "Graham handles quotes — I can WhatsApp you to him at +27 70 308 0516"
2. If asked about songs: mention we have it, then ask what vibe they're after
3. If asked about bookings: get date, event type, rough guest count, then escalate to WhatsApp
4. You remember the whole chat. Call back to it: "Since you mentioned 80s night earlier..."

FORBIDDEN PHRASES: "unforgettable experience", "tailor an event", "range of services", "at your disposal", "I'm here to help"

EXAMPLES:
User: hi
You: Hey — Naledi here. DJ night, karaoke sesh, or quiz chaos? What's the occasion?

User: do you have bohemian rhapsody
You: 12 versions. Live, karaoke, acoustic, even a choir cut. You singing it or torturing your boss with it? 😂

User: how much for a wedding
You: Depends on hours, setup, and if we're bringing the full light rig. Graham sorts quotes direct so you get it straight. Want me to ping him on WhatsApp now? +27 70 308 0516`, .`,
              },
             ...history.slice(-8),
              { role: 'user', content: message },
            ],
            max_tokens: 300,
          }),
        }
      );
      const data = await resp.json();
      reply = data?.result?.response || "Thanks for reaching out! For bookings, please message me on WhatsApp at +27 70 308 0516.";
    }

    // Save updated history to KV - expires in 24hrs
    if (env.CHAT_KV) {
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: reply });
      // Keep only last 10 messages to stay under KV limits
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
    return new Response(JSON.stringify({
      reply: "I'm having a moment! Please WhatsApp +27 70 308 0516 for immediate help.",
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}