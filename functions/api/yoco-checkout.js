export async function onRequestPost(context) {
  const { request, env } = context;

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
      return Response.json({
        success: false,
        error: charge.displayMessage || charge.errorMessage || 'Payment failed',
      });
    }

    return Response.json({
      success: true,
      chargeId: charge.id,
      status: charge.status,
    });
  } catch (err) {
    return Response.json({ success: false, error: 'Server error. Please try again.' });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
