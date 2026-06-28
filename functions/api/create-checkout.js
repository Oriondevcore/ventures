const HELPME_API = 'https://helpme-api.orion269.workers.dev';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { amountInCents, currency, metadata } = body;

    if (!amountInCents || !currency) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const baseUrl = new URL(request.url).origin;

    const checkoutPayload = {
      amount: amountInCents,
      currency,
      successUrl: `${baseUrl}/onboard/practitioner/?payment=success`,
      cancelUrl: `${baseUrl}/onboard/practitioner/?payment=cancelled`,
      failureUrl: `${baseUrl}/onboard/practitioner/?payment=failed`,
      metadata: {
        ...(metadata || {}),
        source: 'naledi_onboarding',
      },
      externalId: metadata?.submissionId || `ORD-${Date.now()}`,
    };

    const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.YOCO_LIVE_SK}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutPayload),
    });

    const checkout = await yocoRes.json();

    if (!yocoRes.ok) {
      const bodyText = JSON.stringify(checkout);
      return Response.json({
        success: false,
        error: checkout.message || checkout.reason || checkout.error || 'Yoco returned ' + yocoRes.status + ': ' + bodyText,
        yocoStatus: yocoRes.status,
        yocoBody: checkout,
      });
    }

    return Response.json({
      success: true,
      redirectUrl: checkout.redirectUrl,
      checkoutId: checkout.id,
    });
  } catch (err) {
    return Response.json({ success: false, error: 'Server error: ' + err.message });
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
