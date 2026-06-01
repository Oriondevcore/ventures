// /api/yoco-checkout — Generate Yoco payment links on the fly
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
    const { amount, name, email, product, orderNumber } = await request.json();

    if (!amount || !name || !email || !product) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const amountInCents = Math.round(amount * 100);
    const orderRef = orderNumber || `OV-${Date.now()}`;

    const checkoutData = {
      amount: amountInCents,
      currency: 'ZAR',
      metadata: {
        customerName: name,
        customerEmail: email,
        orderNumber: orderRef,
        product: product,
        source: 'Naledi AI'
      }
    };

    const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.YOCO_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutData)
    });

    if (!yocoRes.ok) {
      const err = await yocoRes.text();
      console.log('Yoco Error:', yocoRes.status, err);
      return Response.json({ error: 'Payment link failed. WhatsApp +27 70 308 0516' }, { status: 502 });
    }

    const checkout = await yocoRes.json();
    return Response.json({ url: checkout.redirectUrl, orderNumber: orderRef });

  } catch (err) {
    return Response.json({ error: 'Server error. WhatsApp +27 70 308 0516' }, { status: 500 });
  }
}
