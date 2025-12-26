//components/ChartPanel.jsx

'use client';

import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import LoadingChartPlaceholder from './LoadingChartPlaceholder';
import { MANUAL_PALETTE } from '../lib/rankingUtils';

function toNumber(x) {
  if (x === null || x === undefined || x === '') return null;
  const n = typeof x === 'string' ? Number(String(x).replace(',', '.')) : Number(x);
  return Number.isFinite(n) ? n : null;
}

export default function ChartPanel({ rows = [], loading = false }) {
  const primary = MANUAL_PALETTE[0] ?? '#337d26';

  const clean = useMemo(() => {
    const arr = Array.isArray(rows) ? rows : [];
    return arr
      .map((r) => {
        const club = r?.club;
        const v = toNumber(r?.value ?? r?.score ?? r?.iap ?? r?.iap_score ?? null);
        return { club, value: v };
      })
      .filter((r) => r.club && r.club !== '—' && r.value !== null);
  }, [rows]);

  if (loading) {
    return (
      <div style={{ height: 360, width: '100%' }}>
        <LoadingChartPlaceholder height={360} />
      </div>
    );
  }

  if (clean.length === 0) {
    return (
      <div style={{ height: 360, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
        Sem dados para plotar.
      </div>
    );
  }

  const barData = {
    labels: clean.map((r) => r.club),
    datasets: [{ label: 'IAP', data: clean.map((r) => r.value), backgroundColor: primary }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div style={{ height: 360, width: '100%' }}>
      <Bar data={barData} options={barOptions} />
    </div>
  );
}
