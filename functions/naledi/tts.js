export async function onRequestPost(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }

  try {
    const { text, lang = 'en' } = await request.json();
    if (!text || !text.trim()) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }

    const ai = env?.AI;
    if (!ai) {
      return Response.json({ error: 'AI binding not available' }, { status: 503 });
    }

    const result = await ai.run('@cf/myshell-ai/melotts', {
      prompt: text.slice(0, 500),
      lang: lang
    });

    if (result?.audio) {
      return Response.json({ audio: result.audio, format: 'mp3' });
    }

    return Response.json({ error: 'TTS failed' }, { status: 500 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
