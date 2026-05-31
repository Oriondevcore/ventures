// /api/chat — AI Chat endpoint for Orion Ventures
// Calls Cloudflare Workers AI (Llama 3.2 3B) + KV Memory

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
      return new Response(JSON.stringify({ reply: 'Please send a message.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cookie = request.headers.get('Cookie') || '';
    const sessionMatch = cookie.match(/session_id=([^;]+)/);
    const sessionId = sessionMatch ?