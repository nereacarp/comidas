const HOP_BY_HOP_HEADERS = [
  'connection',
  'content-encoding',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

function backendUrl(): URL {
  const configured = process.env.BACKEND_URL?.trim();
  if (!configured) throw new Error('BACKEND_URL no está configurada');
  const url = new URL(configured);
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('BACKEND_URL debe contener únicamente el origen');
  }
  if (process.env.VERCEL && url.protocol !== 'https:') {
    throw new Error('BACKEND_URL debe utilizar HTTPS en Vercel');
  }
  return url;
}

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const incoming = new URL(request.url);
      const path = incoming.pathname.replace(/^\/api(?=\/|$)/, '') || '/';
      const target = new URL(`${path}${incoming.search}`, backendUrl());
      const headers = new Headers(request.headers);
      HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header));

      const response = await fetch(target, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
        redirect: 'manual',
      });
      const responseHeaders = new Headers(response.headers);
      HOP_BY_HOP_HEADERS.forEach((header) => responseHeaders.delete(header));
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch {
      return Response.json({ error: 'La API no está disponible' }, { status: 503 });
    }
  },
};
