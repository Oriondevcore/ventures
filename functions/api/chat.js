export async function onRequestPost(request) {
  return new Response("Naledi is alive and JSON", {
    headers: { "Content-Type": "application/json" }
  });
}
