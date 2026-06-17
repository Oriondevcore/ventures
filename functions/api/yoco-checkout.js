const HELPME_API = 'https://helpme-api.orion269.workers.dev';

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

    const isKaraoke = metadata?.product?.includes('Custom Karaoke Track');
    const orderPayload = {
      chargeId: charge.id,
      product: metadata?.product || 'Unknown product',
      amount: amountInCents / 100,
      currency: currency || 'ZAR',
      customerName: metadata?.customerName || 'Unknown',
      customerEmail: metadata?.customerEmail || 'unknown@email.com',
      orderType: isKaraoke ? 'karaoke' : 'print',
      orderNumber: metadata?.orderNumber || `OV-${Date.now()}`,
      notes: metadata?.notes || null,
    };

    try {
      await fetch(`${HELPME_API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
    } catch (err) {
      console.error('Failed to save order:', err);
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
