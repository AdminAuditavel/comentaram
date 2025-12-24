// app/club/[name]/page.jsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function toNumber(x) {
  const n = typeof x === 'string' ? Number(String(x).replace(',', '.')) : Number(x);
  return Number.isFinite(n) ? n : null;
}

export default function ClubPage() {
  const params = useParams();
  const rawName = params?.name; // string | string[] | undefined (na prática, string)
  const clubName = useMemo(() => {
    if (!rawName) return '';
    const v = Array.isArray(rawName) ? rawName[0] : rawName;
    // Next já decodifica muitas vezes, mas garantimos robustez:
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }, [rawName]);

  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSeries = async (name) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/club_series?club=${encodeURIComponent(name)}&limit_days=90`);
      if (!res.ok) throw new Error(`Erro ao buscar série do clube (${res.status})`);
      const json = await res.json();
      setSeries(Array.isArray(json) ? json : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubName) fetchSeries(clubName);
  }, [clubName]);

  const rows = useMemo(() => {
    return (Array.isArray(series) ? series : [])
      .map((r) => ({
        date: r?.date,
        value: toNumber(r?.value),
      }))
      .filter((r) => r.date && r.value !== null);
  }, [series]);

  const chartData = useMemo(() => {
    return {
      labels: rows.map((r) => String(r.date).slice(0, 10)), // YYYY-MM-DD
      datasets: [{ label: 'IAP', data: rows.map((r) => r.value) }],
    };
  }, [rows]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: { y: { beginAtZero: true } },
    };
  }, []);

  return (
    <div style={{ display: 'grid', gap: 16, padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>{clubName || 'Clube'}</h1>
        <Link href="/" style={{ textDecoration: 'underline' }}>
          Voltar ao ranking
        </Link>
      </div>

      {/* Debug mínimo (pode remover depois) */}
      <div style={{ fontSize: 12, opacity: 0.75 }}>
        Param: <code>{String(rawName ?? '')}</code>
      </div>

      {loading ? <div>Carregando série…</div> : null}

      {error ? (
        <div>
          Erro ao buscar série: {error.message}
          <button onClick={() => fetchSeries(clubName)} style={{ marginLeft: 12 }}>
            Tentar novamente
          </button>
        </div>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <div>Nenhum dado de série disponível para este clube.</div>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <div style={{ height: 420, width: '100%' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      ) : null}
    </div>
  );
}
