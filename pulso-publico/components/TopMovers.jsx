//components/TopMovers.jsx
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

/* ========= Helpers locais ========= */
function getDisplayName(it) {
  return (it && ((it.club && it.club.name) || it.club_name || it.name || it.club || it.label)) || null;
}

function normalizeClubKey(name) {
  const s = String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function TopMovers({ tableItems = [], prevRankMap = new Map(), prevDateUsed = '' }) {
  const computed = useMemo(() => {
    if (!Array.isArray(tableItems) || tableItems.length === 0) {
      return { state: 'no-data', up: [], down: [] };
    }
    if (!prevDateUsed || !(prevRankMap instanceof Map) || prevRankMap.size === 0) {
      return { state: 'no-prev', up: [], down: [] };
    }

    const all = [];

    for (let i = 0; i < tableItems.length; i += 1) {
      const it = tableItems[i];
      const name = getDisplayName(it);
      if (!name || name === '—') continue;

      const key =
        (it && (it.__club_key || it._club_key)) ? String(it.__club_key || it._club_key) : normalizeClubKey(name);

      const currRankRaw = it?.rank_position;
      const currRank = Number(currRankRaw) || i + 1;

      // IMPORTANT: tenta display e key normalizada (porque Ranking.jsx salva ambos)
      const prevRank =
        prevRankMap.get(name) ??
        prevRankMap.get(key) ??
        null;

      if (prevRank == null || !currRank) continue;

      const delta = Number(prevRank) - Number(currRank);
      if (!Number.isFinite(delta) || delta === 0) continue;

      all.push({ name, key, currRank, prevRank: Number(prevRank), delta });
    }

    const up = all
      .filter((x) => x.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 5);

    const down = all
      .filter((x) => x.delta < 0)
      .sort((a, b) => a.delta - b.delta) // mais negativo primeiro
      .slice(0, 5);

    return { state: 'ok', up, down };
  }, [tableItems, prevRankMap, prevDateUsed]);

  if (computed.state === 'no-data') {
    return <div style={{ fontSize: 12, opacity: 0.8 }}>Sem dados.</div>;
  }

  if (computed.state === 'no-prev') {
    return <div style={{ fontSize: 12, opacity: 0.8 }}>Sem comparação disponível (não há dados do dia anterior).</div>;
  }

  const { up, down } = computed;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>Mais subiram</div>

        {up.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.8 }}>—</div>
        ) : (
          <ol style={{ margin: '8px 0 0 18px', padding: 0 }}>
            {up.map((m) => (
              <li key={`${m.key || m.name}-up`} style={{ marginBottom: 6, fontSize: 13 }}>
                <Link href={`/club/${encodeURIComponent(m.name)}`} style={{ textDecoration: 'underline' }}>
                  {m.name}
                </Link>{' '}
                <span style={{ fontWeight: 700, color: '#16A34A' }}>↑ +{m.delta}</span>{' '}
                <span style={{ opacity: 0.75 }}>({m.prevRank} → {m.currRank})</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>Mais caíram</div>

        {down.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.8 }}>—</div>
        ) : (
          <ol style={{ margin: '8px 0 0 18px', padding: 0 }}>
            {down.map((m) => (
              <li key={`${m.key || m.name}-down`} style={{ marginBottom: 6, fontSize: 13 }}>
                <Link href={`/club/${encodeURIComponent(m.name)}`} style={{ textDecoration: 'underline' }}>
                  {m.name}
                </Link>{' '}
                <span style={{ fontWeight: 700, color: '#DC2626' }}>↓ {m.delta}</span>{' '}
                <span style={{ opacity: 0.75 }}>({m.prevRank} → {m.currRank})</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
