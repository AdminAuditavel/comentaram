// app/api/daily_ranking/route.js
export async function GET(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const incoming = url.searchParams;

    // Monta params para o PostgREST do Supabase
    const params = new URLSearchParams();

    // Mantém os defaults atuais
    params.set('select', incoming.get('select') || '*');
    params.set('order', incoming.get('order') || 'score.desc');
    params.set('limit', incoming.get('limit') || '20');

    // >>> SUPORTE A ?date=YYYY-MM-DD <<<
    // Estratégia: se existir uma coluna de data conhecida na view/tabela, aplica filtro.
    // Tentamos os nomes mais comuns: bucket_date, day, date, ranking_date, metric_date.
    // (Só aplicamos filtro no recurso que suportar; caso não suporte, cai no fallback.)
    const requestedDate = incoming.get('date'); // "YYYY-MM-DD" esperado
    const dateFilterCandidates = ['bucket_date', 'day', 'date', 'ranking_date', 'metric_date'];

    const base = supabaseUrl.replace(/\/$/, '') + '/rest/v1';

    // Candidatos: tenta view com nomes primeiro
    const candidates = ['daily_ranking_with_names', 'daily_ranking', 'daily_rankings'];

    let rankings = null;
    let lastErrorText = '';
    let usedResource = null;

    // Função: tenta buscar em um recurso, com ou sem filtro de data
    async function tryFetch(resource, withDateFilter) {
      const p = new URLSearchParams(params);

      if (withDateFilter && requestedDate) {
        // adiciona todos os filtros possíveis; PostgREST ignora apenas se coluna não existir? (na prática, erro)
        // então testamos 1 a 1 em tentativas separadas.
        // Aqui só prepara; a lógica de tentativa 1-a-1 fica no loop abaixo.
      }

      const target = `${base}/${resource}?${p.toString()}`;
      const res = await fetch(target, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json',
        },
      });

      const text = await res.text();
      return { ok: res.ok, text };
    }

    for (const resource of candidates) {
      // 1) Se não pediram date, mantém o comportamento atual
      if (!requestedDate) {
        const { ok, text } = await tryFetch(resource, false);
        if (ok) {
          try {
            rankings = JSON.parse(text);
          } catch {
            rankings = [];
          }
          usedResource = resource;
          break;
        } else {
          lastErrorText = text;
          continue;
        }
      }

      // 2) Se pediram date, tenta aplicar filtro em colunas possíveis (uma por vez)
      let foundForThisResource = false;

      for (const col of dateFilterCandidates) {
        const p = new URLSearchParams(params);
        // PostgREST: col=eq.2025-12-24
        p.set(col, `eq.${requestedDate}`);

        const target = `${base}/${resource}?${p.toString()}`;
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
          } catch {
            rankings = [];
          }
          usedResource = resource;
          foundForThisResource = true;
          break;
        } else {
          lastErrorText = text;
        }
      }

      if (foundForThisResource) break;

      // 3) Se nenhuma coluna de data funcionou nesse resource, tenta sem filtro (fallback)
      const { ok, text } = await tryFetch(resource, false);
      if (ok) {
        try {
          rankings = JSON.parse(text);
        } catch {
          rankings = [];
        }
        usedResource = resource;
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

    // Compatibilidade com o frontend (club: { name })
    const mapped = rankings.map((item) => {
      if (item?.club && item.club.name) return item;
      if (item?.club_name) return { ...item, club: { name: item.club_name } };
      return item;
    });

    // Header útil para debug (não quebra nada)
    return new Response(JSON.stringify(mapped), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Source-Resource': usedResource || '',
      },
    });
  } catch (err) {
    console.error('Erro na rota /api/daily_ranking:', err);
    return new Response(JSON.stringify({ error: 'Erro interno na API' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
