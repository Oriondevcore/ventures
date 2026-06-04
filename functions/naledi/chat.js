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
    if (!message || !message.trim()) {
      return Response.json({ reply: 'Please send a message.' }, { status: 400 });
    }

    const systemPrompt = `You are Naledi, the AI brains of Orion Ventures — a one-person entertainment company run by Graham Schubach in Durban, South Africa. You are warm, professional, and concise.

About Orion Ventures:
- Services: DJ, karaoke host, quiz master, music bingo, software development
- Graham has 26 years in hospitality (JW Marriott Dubai, Sun City, uShaka Marine World)
- Library: 667,000+ karaoke songs powered by SupaTraxx at supatraxx.oriondevcore.com
- Events: Connor's Public House every Thursday, corporate events, private parties nationwide
- SAMRO licensed, Founded November 2025

Your tone: Professional but warm. Concise but helpful. You handle bookings, answer questions about services/pricing, and represent Graham when he's busy. Never make up specific pricing — direct users to contact Graham for quotes. Always mention you can connect them via WhatsApp (+27 70 308 0516) for urgent bookings. Keep responses under 3 paragraphs.`;

    // Try AI binding first
    if (env && env.AI) {
      const aiResponse = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
      });
      return Response.json({ reply: aiResponse?.response || "Got it! Let me look into that for you." });
    }

    // Fallback: REST API with token from env or Secrets Store
    const apiToken = (env && env.CLOUDFLARE_API_TOKEN) || '';
    if (apiToken) {
      const resp = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/fdd89cf30de14e1ddcfa5fbbf27581c1/ai/run/@cf/meta/llama-3.2-3b-instruct`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            max_tokens: 300,
          }),
        }
      );
      const data = await resp.json();
      return Response.json({ reply: data?.result?.response || "Thanks for reaching out! For bookings, message me on WhatsApp at +27 70 308 0516." });
    }

    // No AI available — helpful fallback
    return Response.json({
      reply: "Hi! I'm Naledi. I'm currently being set up, but you can reach Graham directly:\n\n📱 WhatsApp: +27 70 308 0516\n📧 info@oriondevcore.com\n\nOr browse the karaoke library at supatraxx.oriondevcore.com"
    });

  } catch (err) {
    return Response.json({
      reply: "I'm having a moment! Please WhatsApp +27 70 308 0516 for immediate help.",
    });
  }
}
