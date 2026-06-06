export async function onRequestPost(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }

  try {
    const { audio: base64Audio } = await request.json();
    if (!base64Audio) {
      return Response.json({ error: 'No audio provided' }, { status: 400 });
    }

    const ai = env?.AI;
    if (!ai) {
      return Response.json({ error: 'AI binding not available' }, { status: 503 });
    }

    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const result = await ai.run('@cf/openai/whisper-large-v3-turbo', {
      audio: [...bytes]
    });

    return Response.json({ text: result?.text || '' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
