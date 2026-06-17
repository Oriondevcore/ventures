export const onRequest = async (context) => {
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

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { token, amountInCents, currency, metadata } = body;

    if (!token || !amountInCents || !currency) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const chargePayload = { token, amountInCents, currency };
    if (metadata) chargePayload.metadata = metadata;

    const yocoRes = await fetch('https://online.yoco.com/v1/charges/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.YOCO_LIVE_SK}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chargePayload),
    });

    const charge = await yocoRes.json();

    if (!yocoRes.ok) {
      console.error('Yoco Error:', yocoRes.status, JSON.stringify(charge));
      return Response.json({
        error: 'Payment failed',
        details: charge.message || charge.error || 'Unknown error',
      }, { status: 502 });
    }

    return Response.json({
      success: true,
      chargeId: charge.id,
      status: charge.status,
    });
  } catch (err) {
    console.error('Worker error:', err);
    return Response.json({ error: 'Server error', message: err.message }, { status: 500 });
  }
};
