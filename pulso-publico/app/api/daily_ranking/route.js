// app/api/daily_ranking/route.js
export const runtime = "nodejs";
export const revalidate = 60;

async function sbFetch(url, supabaseKey) {
  return fetch(url, {
    method: "GET",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: "application/json",
    },
    // cache na Vercel (ISR para rotas)
    next: { revalidate },
  });
}

function jsonResp(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function getLatestAggregationDate(base, supabaseKey) {
  const q = new URLSearchParams();
  q.set("select", "aggregation_date");
  q.set("order", "aggregation_date.desc");
  q.set("limit", "1");

  const candidates = ["daily_ranking_with_names", "daily_ranking", "daily_rankings"];
  for (const resource of candidates) {
    const url = `${base}/${resource}?${q.toString()}`;
    const res = await sbFetch(url, supabaseKey);
    const text = await res.text();
    if (!res.ok) continue;
    const arr = safeJson(text);
    const d = arr?.[0]?.aggregation_date ? String(arr[0].aggregation_date).slice(0, 10) : "";
    if (d) return d;
  }
  return "";
}

export async function GET(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return jsonResp({ error: "SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados" }, 500);
    }

    const incoming = new URL(req.url).searchParams;

    // date opcional (YYYY-MM-DD). Se não vier, usa último dia.
    let requestedDate = (incoming.get("date") || "").trim();
    if (requestedDate && !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      return jsonResp({ error: "Parâmetro date deve estar no formato YYYY-MM-DD" }, 400);
    }

    const base = supabaseUrl.replace(/\/$/, "") + "/rest/v1";

    // resolve date quando não fornecida
    if (!requestedDate) {
      requestedDate = await getLatestAggregationDate(base, supabaseKey);
      if (!requestedDate) {
        return jsonResp({ error: "Não foi possível determinar a data mais recente do ranking" }, 500);
      }
    }

    const limit = incoming.get("limit") || "20";
    const order = incoming.get("order") || "score.desc";
    const select = incoming.get("select") || "*";

    // filtra por aggregation_date = requestedDate
    const params = new URLSearchParams();
    params.set("select", select);
    params.set("order", order);
    params.set("limit", limit);
    params.set("aggregation_date", `eq.${requestedDate}`);

    const candidates = ["daily_ranking_with_names", "daily_ranking", "daily_rankings"];

    let rankings = null;
    let usedResource = "";
    let lastErrorText = "";

    for (const resource of candidates) {
      const target = `${base}/${resource}?${params.toString()}`;
      const res = await sbFetch(target, supabaseKey);
      const text = await res.text();

      if (res.ok) {
        const parsed = safeJson(text);
        rankings = Array.isArray(parsed) ? parsed : [];
        usedResource = resource;
        break;
      } else {
        lastErrorText = text;
      }
    }

    // Se não achou nada para a data pedida (ou resolvida), tenta fallback p/ último dia com dados
    if (rankings && rankings.length === 0) {
      const fallbackDate = await getLatestAggregationDate(base, supabaseKey);
      if (fallbackDate && fallbackDate !== requestedDate) {
        const p2 = new URLSearchParams(params);
        p2.set("aggregation_date", `eq.${fallbackDate}`);

        rankings = null;
        usedResource = "";
        lastErrorText = "";

        for (const resource of candidates) {
          const target = `${base}/${resource}?${p2.toString()}`;
          const res = await sbFetch(target, supabaseKey);
          const text = await res.text();

          if (res.ok) {
            const parsed = safeJson(text);
            rankings = Array.isArray(parsed) ? parsed : [];
            usedResource = resource;
            requestedDate = fallbackDate; // resolveu para data com dados
            break;
          } else {
            lastErrorText = text;
          }
        }
      }
    }

    if (!rankings) {
      return jsonResp(
        {
          error: "Erro ao buscar daily_ranking (nenhuma fonte retornou ok)",
          details: lastErrorText,
        },
        500
      );
    }

    // Mapeia club_name -> club: { name } para compatibilidade
    const mapped = rankings.map((item) => {
      if (item.club && item.club.name) return item;
      if (item.club_name) return { ...item, club: { name: item.club_name } };
      return item;
    });

    // devolve meta no envelope, mas mantém compatibilidade: também expõe array em "data"
    return jsonResp({
      resolved_date: requestedDate,
      source: usedResource,
      count: mapped.length,
      data: mapped,
    });
  } catch (err) {
    console.error("Erro na rota /api/daily_ranking:", err);
    return jsonResp({ error: "Erro interno na API" }, 500);
  }
}
