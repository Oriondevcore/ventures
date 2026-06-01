export async function onRequestPost(context) {
  // Return a pure JSON test response
  return new Response(JSON.stringify({ 
    status: "success", 
    message: "Naledi is online and reachable" 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
