// app/club/[name]/page.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

function toNumber(x) {
  const n = typeof x === 'string' ? Number(String(x).replace(',', '.')) : Number(x);
  return Number.isFinite(n) ? n : null;
}

function normalizeSeries(series) {
  const arr = (Array.isArray(series) ? series : [])
    .map((r) => ({
      date: r?.date ? String(r.date).slice(0, 10) : null,
      value: toNumber(r?.value),
    }))
    .filter((r) => r.date && r.value !== null);

  arr.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return arr;
}

export default function ClubPage({ params }) {
  const clubName = useMemo(() => decodeURIComponent(params?.name || ''), [params]);

  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD (opcional)
  const [snapshot, setSnapshot] = useState(null);
  const [snapLoading, setSnapLoading] = useState(true);
  const [snapError, setSnapError] = useState(null);

  const [series, setSeries] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(true);
  const [seriesError, setSeriesError] = useState(null);

  async function fetchSnapshot(date) {
    setSnapLoading(true);
    setSnapError(null);
    try {
      const qs = new URLSearchParams();
      qs.set('club', clubName);
      if (date) qs.set('date', date);

      const res = await fetch(`/api/club_snapshot?${qs.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao buscar snapshot (${res.status}) ${text ? `- ${text}` : ''}`);
      }
      const json = await res.json();
      setSnapshot(json);
    } catch (e) {
      setSnapError(e);
      setSnapshot(null);
    } finally {
      setSnapLoading(false);
    }
  }

  async function fetchSeries() {
    setSeriesLoading(true);
    setSeriesError(null);
    try {
      const res = await fetch(`/api/club_series?club=${encodeURIComponent(clubName)}&limit_days=180`);
      if (!res.ok) throw new Error(`Erro ao buscar série do clube (${res.status})`);
      const json = await res.json();
      setSeries(normalizeSeries(json));
    } catch (e) {
      setSeriesError(e);
      setSeries([]);
    } finally {
      setSeriesLoading(false);
    }
  }

  useEffect(() => {
    fetchSnapshot('');
    fetchSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubName]);

  useEffect(() => {
    // quando mudar a data, atualiza apenas o snapshot (painel)
    fetchSnapshot(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const lineData = useMemo(() => {
    return {
      labels: series.map((p) => p.date),
      datasets: [
        {
          label: 'IAP (série)',
          data: series.map((p) => p.value),
          borderColor: '#2563EB',
          backgroundColor: '#2563EB',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ],
    };
  }, [series]);

  const lineOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true }, tooltip: { enabled: true } },
      scales: { y: { beginAtZero: true } },
      elements: { line: { tension: 0.25 } },
    };
  }, []);

  // Mini “drivers” (Volume vs Sentimento) para a data do snapshot
  const driversData = useMemo(() => {
    const vol = toNumber(snapshot?.volume_total);
    const sent = toNumber(snapshot?.sentiment_score);

    return {
      labels: ['Volume', 'Sentimento'],
      datasets: [
        {
          label: 'Drivers do dia',
          data: [
            vol !== null ? vol : 0,
            // para sentimento, escala para visual ficar legível (opcional):
            // se quiser puro, deixe só `sent !== null ? sent : 0`
            sent !== null ? Math.round(sent * 100) : 0,
          ],
          backgroundColor: ['#16A34A', '#F97316'],
        },
      ],
    };
  }, [snapshot]);

  const driversOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: { y: { beginAtZero: true } },
    };
  }, []);

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: 16, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Clube — {clubName}</h1>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            <Link href="/" style={{ textDecoration: 'underline' }}>Voltar ao ranking</Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13 }}>Data (painel do dia):</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button onClick={() => setSelectedDate('')} title="Usar o último dia disponível">
            Último dia
          </button>
        </div>
      </div>

      {/* Painel do dia (snapshot) */}
      <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Painel do dia (por que mudou)</div>

        {snapLoading ? (
          <div>Carregando painel…</div>
        ) : snapError ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <div>Erro ao buscar painel: {snapError.message}</div>
            <button onClick={() => fetchSnapshot(selectedDate)}>Tentar novamente</button>
          </div>
        ) : snapshot ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Data</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{snapshot.aggregation_date || '—'}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>IAP (score)</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {snapshot.score !== null && snapshot.score !== undefined ? Number(snapshot.score).toFixed(2) : '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Volume total</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {snapshot.volume_total !== null && snapshot.volume_total !== undefined ? snapshot.volume_total : '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Sentimento</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {snapshot.sentiment_score !== null && snapshot.sentiment_score !== undefined
                    ? Number(snapshot.sentiment_score).toFixed(2)
                    : '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Posição</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {snapshot.rank_position !== null && snapshot.rank_position !== undefined ? snapshot.rank_position : '—'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Nota: no gráfico “Drivers”, o sentimento está multiplicado por 100 (apenas para visual).
              </div>

              <div style={{ height: 220 }}>
                <Bar data={driversData} options={driversOptions} />
              </div>
            </div>
          </>
        ) : (
          <div>Nenhum snapshot encontrado.</div>
        )}
      </section>

      {/* Série temporal */}
      <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Série temporal (últimos 180 dias)</div>

        {seriesLoading ? (
          <div>Carregando série…</div>
        ) : seriesError ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <div>Erro ao buscar série: {seriesError.message}</div>
            <button onClick={fetchSeries}>Tentar novamente</button>
          </div>
        ) : series.length === 0 ? (
          <div>Nenhum dado de série disponível.</div>
        ) : (
          <div style={{ height: 420 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        )}
      </section>
    </main>
  );
}
