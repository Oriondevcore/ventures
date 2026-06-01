export async function onRequestPost(context) {
  const { request, env } = context;
  const { message } = await request.json();

  // 1. Your Gateway Endpoint
  const GATEWAY_URL = "https://gateway.ai.cloudflare.com/v1/fdd89cf30de14e1ddcfa5fbbf27581c1/my-gateway/openai/chat/completions";

  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`, // Ensure this is in your Dashboard Secrets
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "@cf/google/gemma-4-26b-it", // Using your specified model
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    
    return new Response(JSON.stringify({ 
      reply: data.choices[0].message.content 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
