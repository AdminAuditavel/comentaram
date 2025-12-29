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

function truncateLabel(s, max = 18) {
  const str = String(s ?? '').trim();
  if (str.length <= max) return str;
  return str.slice(0, Math.max(0, max - 1)) + '…';
}

/**
 * ChartPanel (Ranking)
 * Props:
 *  - rows: [{ club, value/score/iap/iap_score, ... }]
 *  - loading: boolean
 *  - topN: number (default 15) -> limita para ficar compacto
 *  - height: number (default 520)
 *  - horizontal: boolean (default true)
 *  - onBarClick: (clubName: string) => void (opcional)
 */
export default function ChartPanel({
  rows = [],
  loading = false,
  topN = 15,
  height = 520,
  horizontal = true,
  onBarClick,
}) {
  const primary = MANUAL_PALETTE[0] ?? '#337d26';

  const clean = useMemo(() => {
    const arr = Array.isArray(rows) ? rows : [];
    const mapped = arr
      .map((r) => {
        const club = r?.club;
        const v = toNumber(r?.value ?? r?.score ?? r?.iap ?? r?.iap_score ?? null);
        return { club, value: v };
      })
      .filter((r) => r.club && r.club !== '—' && r.value !== null);

    // Se já vier ordenado, mantém; se não, garante desc
    mapped.sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));

    return mapped.slice(0, Math.max(1, Number(topN) || 15));
  }, [rows, topN]);

  if (loading) {
    return (
      <div style={{ height, width: '100%' }}>
        <LoadingChartPlaceholder height={height} />
      </div>
    );
  }

  if (clean.length === 0) {
    return (
      <div style={{ height, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
        Sem dados para plotar.
      </div>
    );
  }

  const labelsFull = clean.map((r) => r.club);
  const labelsShort = labelsFull.map((s) => truncateLabel(s, 18));

  const barData = {
    labels: horizontal ? labelsFull : labelsShort,
    datasets: [
      {
        label: 'IAP',
        data: clean.map((r) => r.value),
        backgroundColor: primary,
        borderRadius: 6,
        barThickness: horizontal ? 16 : undefined,
        maxBarThickness: 22,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          title: (items) => {
            if (!items || items.length === 0) return '';
            const idx = items[0].dataIndex;
            return labelsFull[idx] ?? '';
          },
          label: (ctx) => {
            const v = ctx?.parsed?.[horizontal ? 'x' : 'y'];
            const num = typeof v === 'number' ? v : Number(v);
            if (!Number.isFinite(num)) return 'IAP: —';
            return `IAP: ${num.toFixed(2)}`;
          },
        },
      },
    },
    scales: horizontal
      ? {
          x: {
            beginAtZero: true,
            ticks: {
              maxTicksLimit: 6,
            },
            grid: {
              color: 'rgba(0,0,0,0.06)',
            },
          },
          y: {
            ticks: {
              callback: function (value, index) {
                // mostra label curto, tooltip mostra completo
                return labelsShort[index] ?? '';
              },
              autoSkip: false,
            },
            grid: {
              display: false,
            },
          },
        }
      : {
          y: { beginAtZero: true },
        },
    onClick: (evt, elements, chart) => {
      if (!onBarClick || !elements || elements.length === 0) return;
      const idx = elements[0]?.index;
      const clubName = labelsFull[idx];
      if (clubName) onBarClick(clubName);
    },
  };

  return (
    <div style={{ height, width: '100%' }}>
      <Bar data={barData} options={barOptions} />
    </div>
  );
}
