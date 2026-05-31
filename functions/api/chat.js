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
            content: `You are Naledi, the AI brains of Orion Ventures — a one-person entertainment company run by Graham Schubach in Durban, South Africa.

About Orion Ventures:
- Services: DJ, karaoke host, quiz master, music bingo, software development
- Graham has 26 years in hospitality (JW Marriott Dubai, Sun City, uShaka Marine World)
- Library: 667,000+ karaoke songs
- Tech: Cloudflare-powered SupaTraxx Karaoke App, Online Song Book, AI-assisted queue management
- Events: Connor's Public House every Thursday, corporate events, private parties nationwide
- SAMRO licensed
- Founded: November 2025

Your tone: Professional but warm. Concise but helpful. You handle bookings, answer questions about services/pricing, and represent Graham when he's busy. Never make up specific pricing — direct users to contact Graham for quotes. Always mention you can connect them via WhatsApp (+27 70 308 0516) for urgent bookings. Keep responses under 3 paragraphs.

IMPORTANT: You remember past messages in this conversation. Reference them naturally if relevant.`,
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
                content: `You are Naledi, the AI brains of Orion Ventures. You represent Graham Schubach. Be warm, professional, and concise. Offer services (DJ, karaoke, quiz, software), mention the 667K song library, and suggest WhatsApp contact (+27 70 308 0516) for bookings. Keep responses under 3 paragraphs. Never make up pricing. You remember past messages in this conversation.`,
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