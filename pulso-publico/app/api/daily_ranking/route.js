// app/api/daily_ranking/route.js
export async function GET(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // preserva e reaplica query params do pedido original (permitindo limit, offset, filtros, etc.)
    const incoming = new URL(req.url).searchParams;
    const params = new URLSearchParams(incoming);
    // Força select e ordenação padrão (se quiser outra ordenação, passe ?order=campo.asc|desc no frontend)
    if (!params.has('select')) params.set('select', '*');
    if (!params.has('order')) params.set('order', 'score.desc');

    const target = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/daily_ranking?${params.toString()}`;

    const res = await fetch(target, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    });

    const text = await res.text();
    const contentType = res.headers.get('content-type') || '';
    const headersOut = { 'Content-Type': contentType.includes('application/json') ? 'application/json' : 'text/plain' };

    return new Response(text, { status: res.status, headers: headersOut });
  } catch (err) {
    console.error('Erro na rota /api/daily_ranking:', err);
    return new Response(JSON.stringify({ error: 'Erro interno na API' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
