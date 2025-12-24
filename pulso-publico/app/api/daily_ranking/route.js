//app/api/daily_ranking/route.js
export async function GET(req) {
  try {
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      return new Response(JSON.stringify({ error: 'BACKEND_API_URL não configurada' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // preserva query string
    const url = new URL(req.url);
    const qs = url.search || '';
    const target = `${backendUrl.replace(/\/$/, '')}/daily_ranking${qs}`;

    const headers = {};
    if (process.env.BACKEND_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.BACKEND_API_KEY}`;
    }

    const res = await fetch(target, { headers });
    const text = await res.text();

    // repassa status e corpo. tenta detectar JSON
    const contentType = res.headers.get('content-type') || '';
    const headersOut = { 'Content-Type': contentType.includes('application/json') ? 'application/json' : 'text/plain' };

    return new Response(text, { status: res.status, headers: headersOut });
  } catch (err) {
    console.error('Erro na rota /api/daily_ranking:', err);
    return new Response(JSON.stringify({ error: 'Erro interno na API proxy' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
