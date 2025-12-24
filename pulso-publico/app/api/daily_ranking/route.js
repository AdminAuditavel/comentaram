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

    const incoming = new URL(req.url).searchParams;
    const params = new URLSearchParams(incoming);

    if (!params.has('select')) params.set('select', '*');
    if (!params.has('order')) params.set('order', 'score.desc');
    if (!params.has('limit')) params.set('limit', '20');

    const base = supabaseUrl.replace(/\/$/, '') + '/rest/v1';

    // Tenta a view que já tem club_name primeiro, depois outras fontes
    const candidates = ['daily_ranking_with_names', 'daily_ranking', 'daily_rankings'];
    let rankings = null;
    let lastErrorText = '';

    for (const resource of candidates) {
      const target = `${base}/${resource}?${params.toString()}`;
      const res = await fetch(target, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json',
        },
      });

      const text = await res.text();
      if (res.ok) {
        try {
          rankings = JSON.parse(text);
        } catch (e) {
          rankings = [];
        }
        break;
      } else {
        lastErrorText = text;
      }
    }

    if (!rankings) {
      return new Response(
        JSON.stringify({
          error: 'Erro ao buscar daily_ranking (nenhuma fonte retornou ok)',
          details: lastErrorText,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Se a view trouxe club_name, cria propriedade club: { name } para compatibilidade com frontend
    const mapped = rankings.map((item) => {
      if (item.club && item.club.name) return item; // já tem club
      if (item.club_name) {
        return { ...item, club: { name: item.club_name } };
      }
      return item;
    });

    return new Response(JSON.stringify(mapped), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Erro na rota /api/daily_ranking:', err);
    return new Response(JSON.stringify({ error: 'Erro interno na API' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
