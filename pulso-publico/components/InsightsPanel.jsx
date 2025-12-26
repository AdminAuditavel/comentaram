//components/InsightsPanel.jsx

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { NF } from '../lib/rankingUtils';

/**
 * InsightsPanel
 * Props:
 *  - tableItems: array
 *  - prevMetricsMap: Map
 *  - prevDateUsed: string (YYYY-MM-DD)
 *  - effectiveDate: string
 *  - linkClub: function(name) -> url
 */
export default function InsightsPanel({ tableItems = [], prevMetricsMap = new Map(), prevDateUsed = '', effectiveDate = '', linkClub = (n) => `/club/${encodeURIComponent(n)}` }) {
  const insights = useMemo(() => {
    if (!Array.isArray(tableItems) || tableItems.length === 0) return null;

    const first = tableItems[0];
    const leaderName = (first && ((first.club && first.club.name) || first.club_name || first.name || first.club)) || '—';
    const leaderScore = first ? Number(first?.score ?? first?.iap ?? first?.iap_score) : null;

    let maxVol = null;
    let maxVolName = null;
    let bestSent = null;
    let bestSentName = null;
    let worstSent = null;
    let worstSentName = null;
    let bestUp = null;
    let bestDown = null;

    for (let i = 0; i < tableItems.length; i += 1) {
      const it = tableItems[i];
      const name = (it && ((it.club && it.club.name) || it.club_name || it.name || it.club)) || null;
      if (!name) continue;

      const currScore = it?.score ?? it?.iap ?? it?.iap_score;
      const currVol = it?.volume_total;
      const currSent = it?.sentiment_score;

      if (currVol !== null && currVol !== undefined) {
        if (maxVol === null || currVol > maxVol) {
          maxVol = currVol;
          maxVolName = name;
        }
      }
      if (currSent !== null && currSent !== undefined) {
        if (bestSent === null || currSent > bestSent) { bestSent = currSent; bestSentName = name; }
        if (worstSent === null || currSent < worstSent) { worstSent = currSent; worstSentName = name; }
      }

      const prev = prevMetricsMap.get(name);
      const prevScore = prev ? prev.score : null;
      if (currScore !== null && currScore !== undefined && prevScore !== null && prevScore !== undefined) {
        const delta = Number(currScore) - Number(prevScore);
        if (!bestUp || delta > bestUp.delta) bestUp = { name, delta, prev: prevScore, curr: currScore };
        if (!bestDown || delta < bestDown.delta) bestDown = { name, delta, prev: prevScore, curr: currScore };
      }
    }

    return {
      leader: { name: leaderName, score: leaderScore },
      maxVol: maxVolName ? { name: maxVolName, value: maxVol } : null,
      bestSent: bestSentName ? { name: bestSentName, value: bestSent } : null,
      worstSent: worstSentName ? { name: worstSentName, value: worstSent } : null,
      bestUp,
      bestDown,
      hasPrev: Boolean(prevDateUsed && prevMetricsMap && prevMetricsMap.size > 0),
    };
  }, [tableItems, prevMetricsMap, prevDateUsed]);

  if (!insights) return <div style={{ fontSize: 12, opacity: 0.8 }}>Sem dados.</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
      <div style={{ border: '1px solid #f2f2f2', borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.75 }}>Líder do dia</div>
        <div style={{ fontSize: 14 }}>
          <Link href={linkClub(insights.leader.name)} style={{ textDecoration: 'underline', fontWeight: 700 }}>
            {insights.leader.name}
          </Link>{' '}
          {insights.leader.score !== null ? <span style={{ opacity: 0.85 }}>({NF.format(insights.leader.score)})</span> : null}
        </div>
      </div>

      <div style={{ border: '1px solid #f2f2f2', borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.75 }}>Maior alta de IAP (Δ)</div>
        {insights.hasPrev && insights.bestUp ? (
          <div style={{ fontSize: 14 }}>
            <Link href={linkClub(insights.bestUp.name)} style={{ textDecoration: 'underline', fontWeight: 700 }}>
              {insights.bestUp.name}
            </Link>{' '}
            <span style={{ color: '#16A34A', fontWeight: 700 }}>+{insights.bestUp.delta.toFixed(2)}</span>{' '}
            <span style={{ opacity: 0.75 }}>({insights.bestUp.prev.toFixed(2)} → {insights.bestUp.curr.toFixed(2)})</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.8 }}>—</div>
        )}
      </div>

      <div style={{ border: '1px solid #f2f2f2', borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.75 }}>Maior queda de IAP (Δ)</div>
        {insights.hasPrev && insights.bestDown ? (
          <div style={{ fontSize: 14 }}>
            <Link href={linkClub(insights.bestDown.name)} style={{ textDecoration: 'underline', fontWeight: 700 }}>
              {insights.bestDown.name}
            </Link>{' '}
            <span style={{ color: '#DC2626', fontWeight: 700 }}>{insights.bestDown.delta.toFixed(2)}</span>{' '}
            <span style={{ opacity: 0.75 }}>({insights.bestDown.prev.toFixed(2)} → {insights.bestDown.curr.toFixed(2)})</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.8 }}>—</div>
        )}
      </div>

      <div style={{ border: '1px solid #f2f2f2', borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.75 }}>Maior volume do dia</div>
        {insights.maxVol ? (
          <div style={{ fontSize: 14 }}>
            <Link href={linkClub(insights.maxVol.name)} style={{ textDecoration: 'underline', fontWeight: 700 }}>
              {insights.maxVol.name}
            </Link>{' '}
            <span style={{ opacity: 0.85 }}>({NF.format(insights.maxVol.value)})</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.8 }}>—</div>
        )}
      </div>

      <div style={{ border: '1px solid #f2f2f2', borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.75 }}>Sentimento do dia (melhor / pior)</div>
        <div style={{ fontSize: 13, display: 'grid', gap: 4 }}>
          {insights.bestSent ? (
            <div>
              <Link href={linkClub(insights.bestSent.name)} style={{ textDecoration: 'underline', fontWeight: 700 }}>
                {insights.bestSent.name}
              </Link>{' '}
              <span style={{ color: '#16A34A', fontWeight: 700 }}>{insights.bestSent.value.toFixed(2)}</span>
            </div>
          ) : (
            <div style={{ opacity: 0.8 }}>—</div>
          )}

          {insights.worstSent ? (
            <div>
              <Link href={linkClub(insights.worstSent.name)} style={{ textDecoration: 'underline', fontWeight: 700 }}>
                {insights.worstSent.name}
              </Link>{' '}
              <span style={{ color: '#DC2626', fontWeight: 700 }}>{insights.worstSent.value.toFixed(2)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
