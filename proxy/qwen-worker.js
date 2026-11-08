/* Optional relay for Qwen speech recognition, for when the browser cannot call Alibaba Cloud directly (CORS).
   Deploy as a Cloudflare Worker, then put https://<your-worker>.workers.dev/compatible-mode/v1 into the
   "语音识别" address field. It stores nothing: the API key comes from the page and is passed straight through. */
const TARGET = 'https://dashscope-intl.aliyuncs.com';
const CORS = {
  'access-control-allow-origin': 'https://peteryin1969.github.io',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'POST,OPTIONS',
  'access-control-max-age': '86400',
};
export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url);
    if (req.method !== 'POST' || url.pathname !== '/compatible-mode/v1/chat/completions')
      return new Response('not found', { status: 404, headers: CORS });
    const r = await fetch(TARGET + url.pathname, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: req.headers.get('authorization') || '' },
      body: req.body,
    });
    const h = new Headers(r.headers);
    Object.entries(CORS).forEach(([k, v]) => h.set(k, v));
    return new Response(r.body, { status: r.status, headers: h });
  },
};
