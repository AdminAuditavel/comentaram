// app/api/club_sources_day/route.js
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
    const club = (url.searchParams.get('club') || '').trim();
    const date = (url.searchParams.get('date') || '').trim(); // YYYY-MM-DD opcional

    if (!club) {
      return new Response(JSON.stringify({ error: 'Parâmetro club é obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validação simples de data
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(JSON.stringify({ error: 'Parâmetro date deve estar no formato YYYY-MM-DD' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const base = supabaseUrl.replace(/\/$/, '') + '/rest/v1';

    // 1) resolve club_id por name_official ou name_short
    //    Usa "or" do PostgREST: or=(name_official.eq.X,name_short.eq.X)
    const clubQ = new URLSearchParams();
    clubQ.set('select', 'id,name_official,name_short');
    clubQ.set('or', `(name_official.eq.${club},name_short.eq.${club})`);
    clubQ.set('limit', '1');

    const clubRes = await fetch(`${base}/clubs?${clubQ.toString()}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    });

    const clubText = await clubRes.text();
    if (!clubRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar clube', club, details: clubText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let clubArr = [];
    try {
      clubArr = JSON.parse(clubText);
    } catch {
      clubArr = [];
    }

    if (!Array.isArray(clubArr) || clubArr.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Clube não encontrado na tabela clubs pelo nome informado', club }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clubId = clubArr[0].id;

    // 2) data alvo: se não vier, tenta pegar a última aggregation_date do daily_ranking_with_names
    let targetDate = date;

    if (!targetDate) {
      const lastQ = new URLSearchParams();
      lastQ.set('select', 'aggregation_date');
      lastQ.set('order', 'aggregation_date.desc');
      lastQ.set('limit', '1');

      // tenta daily_ranking_with_names, fallback daily_ranking
      const candidates = ['daily_ranking_with_names', 'daily_ranking'];
      let got = '';

      for (const resource of candidates) {
        const r = await fetch(`${base}/${resource}?${lastQ.toString()}`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Accept: 'application/json',
          },
        });
        const t = await r.text();
        if (r.ok) {
          try {
            const arr = JSON.parse(t);
            got = arr?.[0]?.aggregation_date ? String(arr[0].aggregation_date).slice(0, 10) : '';
          } catch {
            got = '';
          }
          if (got) break;
        }
      }

      targetDate = got;
    }

    if (!targetDate) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível determinar a data alvo (forneça date=YYYY-MM-DD)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3) calcula janela do dia em UTC (PostgREST aceita ISO)
    const dayStart = `${targetDate}T00:00:00Z`;
    const nextDay = new Date(`${targetDate}T00:00:00Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const dayEnd = nextDay.toISOString(); // exclusive

    // 4) busca time_bucket_metrics do dia para o clube e agrega client-side por source_id
    const tbQ = new URLSearchParams();
    tbQ.set('select', 'source_id,volume_raw,sentiment_score,bucket_start');
    tbQ.set('club_id', `eq.${clubId}`);
    tbQ.set('bucket_start', `gte.${dayStart}`);
    tbQ.append('bucket_start', `lt.${dayEnd}`);
    tbQ.set('limit', '10000');

    const tbRes = await fetch(`${base}/time_bucket_metrics?${tbQ.toString()}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    });

    const tbText = await tbRes.text();
    if (!tbRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar time_bucket_metrics', club, club_id: clubId, date: targetDate, details: tbText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let buckets = [];
    try {
      buckets = JSON.parse(tbText);
    } catch {
      buckets = [];
    }

    // 5) agrega por source_id
    const agg = new Map(); // source_id -> { volume, sentSum, sentCount }
    for (const row of buckets) {
      const sid = row?.source_id;
      if (!sid) continue;

      const vol = Number(row?.volume_raw) || 0;
      const sent = row?.sentiment_score;
      const sentNum = typeof sent === 'number' ? sent : Number(sent);

      const cur = agg.get(sid) || { volume: 0, sentSum: 0, sentCount: 0 };
      cur.volume += vol;

      if (Number.isFinite(sentNum)) {
        cur.sentSum += sentNum;
        cur.sentCount += 1;
      }

      agg.set(sid, cur);
    }

    const sourceIds = Array.from(agg.keys());
    if (sourceIds.length === 0) {
      return new Response(
        JSON.stringify({
          club,
          club_id: clubId,
          date: targetDate,
          sources: [],
          note: 'Sem buckets no dia para este clube.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6) resolve code/name das sources
    const srcQ = new URLSearchParams();
    srcQ.set('select', 'id,code');
    srcQ.set('id', `in.(${sourceIds.join(',')})`);
    srcQ.set('limit', '1000');

    const srcRes = await fetch(`${base}/sources?${srcQ.toString()}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    });

    const srcText = await srcRes.text();
    if (!srcRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar sources', details: srcText }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let srcArr = [];
    try {
      srcArr = JSON.parse(srcText);
    } catch {
      srcArr = [];
    }
    const srcMap = new Map(srcArr.map((s) => [s.id, s.code || s.id]));

    // 7) monta resposta ordenada por volume desc
    const out = sourceIds
      .map((sid) => {
        const a = agg.get(sid);
        const code = srcMap.get(sid) || sid;
        const avgSent = a.sentCount > 0 ? a.sentSum / a.sentCount : null;

        return {
          source_id: sid,
          source_code: code,
          volume_total: a.volume,
          sentiment_avg: avgSent,
        };
      })
      .sort((x, y) => (y.volume_total || 0) - (x.volume_total || 0));

    return new Response(
      JSON.stringify({
        club,
        club_id: clubId,
        date: targetDate,
        sources: out,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Erro na rota /api/club_sources_day:', err);
    return new Response(JSON.stringify({ error: 'Erro interno na API' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
