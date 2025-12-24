// app/club/[name]/page.jsx

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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

export default function ClubPage({ params }) {
  const clubName = decodeURIComponent(params?.name ?? '');

  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSeries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/club_series?club=${encodeURIComponent(clubName)}&limit_days=90`);
      if (!res.ok) throw new Error('Erro ao buscar série do clube');
      const json = await res.json();
      setSeries(Array.isArray(json) ? json : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubName) fetchSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      datasets: [
        {
          label: 'IAP',
          data: rows.map((r) => r.value),
        },
      ],
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

      {loading ? <div>Carregando série…</div> : null}

      {error ? (
        <div>
          Erro ao buscar série: {error.message}
          <button onClick={fetchSeries} style={{ marginLeft: 12 }}>
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
