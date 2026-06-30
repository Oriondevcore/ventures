export const onRequest = async ({ request }) => {
  const url = new URL(request.url);
  const workerUrl = `https://helpme-api.orion269.workers.dev${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  const isGetOrHead = request.method === 'GET' || request.method === 'HEAD';

  return fetch(workerUrl, {
    method: request.method,
    headers,
    body: isGetOrHead ? null : await request.clone().text(),
  });
};
