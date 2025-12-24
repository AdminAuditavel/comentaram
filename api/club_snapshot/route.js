// app/api/club_snapshot/route.js
export async function GET(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const clubParam = (url.searchParams.get("club") || "").trim();
    const dateParam = (url.searchParams.get("date") || "").trim(); // YYYY-MM-DD (opcional)

    if (!clubParam) {
      return new Response(JSON.stringify({ error: "Parâmetro club é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const base = supabaseUrl.replace(/\/$/, "") + "/rest/v1";
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: "application/json",
    };

    // 1) Resolve club_id pela tabela clubs
    // Tenta name_official e name_short (case-insensitive) via ilike.
    // Observação: para igualdade case-insensitive, usamos ilike e o valor exato.
    const clubQueries = [
      `${base}/clubs?select=id,name_official,name_short&name_official=ilike.${encodeURIComponent(clubParam)}&limit=1`,
      `${base}/clubs?select=id,name_official,name_short&name_short=ilike.${encodeURIComponent(clubParam)}&limit=1`,
    ];

    let clubRow = null;
    let lastClubErr = "";

    for (const q of clubQueries) {
      const res = await fetch(q, { headers });
      const text = await res.text();
      if (res.ok) {
        const arr = (() => {
          try {
            return JSON.parse(text);
          } catch {
            return [];
          }
        })();
        if (Array.isArray(arr) && arr.length > 0) {
          clubRow = arr[0];
          break;
        }
      } else {
        lastClubErr = text;
      }
    }

    if (!clubRow?.id) {
      return new Response(
        JSON.stringify({
          error: "Clube não encontrado na tabela clubs pelo nome informado",
          club: clubParam,
          details: lastClubErr || null,
          hint: "Verifique se club corresponde a name_official ou name_short (ex.: Cruzeiro, SPFC, etc.)",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const clubId = clubRow.id;
    const clubName = clubRow.name_short || clubRow.name_official || clubParam;

    // 2) Busca snapshot em daily_ranking_with_names (preferencial) ou daily_ranking
    const candidates = ["daily_ranking_with_names", "daily_ranking", "daily_rankings"];
    let snapshot = null;
    let lastSnapErr = "";

    for (const resource of candidates) {
      // Se date foi informado: filtra aggregation_date=eq.YYYY-MM-DD
      // Se não: pega o mais recente order=aggregation_date.desc
      const params = new URLSearchParams();
      params.set("select", "*");
      params.set("club_id", `eq.${clubId}`);
      if (dateParam) {
        params.set("aggregation_date", `eq.${dateParam}`);
        params.set("limit", "1");
      } else {
        params.set("order", "aggregation_date.desc");
        params.set("limit", "1");
      }

      const target = `${base}/${resource}?${params.toString()}`;
      const res = await fetch(target, { headers });
      const text = await res.text();

      if (res.ok) {
        let arr;
        try {
          arr = JSON.parse(text);
        } catch {
          arr = [];
        }
        if (Array.isArray(arr) && arr.length > 0) {
          snapshot = arr[0];
          break;
        } else {
          // ok mas vazio: tenta o próximo resource
          lastSnapErr = text;
        }
      } else {
        lastSnapErr = text;
      }
    }

    if (!snapshot) {
      return new Response(
        JSON.stringify({
          error: "Snapshot não encontrado para o clube (data pode não existir ainda)",
          club: clubParam,
          club_id: clubId,
          date: dateParam || null,
          details: lastSnapErr || null,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const out = {
      club_id: clubId,
      club_name: snapshot.club_name || clubName,
      aggregation_date: snapshot.aggregation_date || null,
      score: snapshot.score ?? snapshot.iap_score ?? snapshot.iap ?? null,
      volume_total: snapshot.volume_total ?? null,
      sentiment_score: snapshot.sentiment_score ?? null,
      rank_position: snapshot.rank_position ?? null,
    };

    return new Response(JSON.stringify(out), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro na rota /api/club_snapshot:", err);
    return new Response(JSON.stringify({ error: "Erro interno na API" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
