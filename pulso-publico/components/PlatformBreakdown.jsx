//pulso-publico/components/PlatformBreakdown.jsx
'use client';

import React from 'react';

/**
 * PlatformBreakdown
 * - Exibe pequenos badges/ícones com contagens por plataforma.
 * - Recebe `platforms` (object) ou campos diretos (volume_youtube, volume_reddit, trends_index).
 *
 * Uso:
 * <PlatformBreakdown item={item} />
 *
 * O componente é defensivo — se não houver dados, mostra traço/placeholder.
 */

function IconYouTube({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="#FF0000" d="M23.5 6.2s-.2-1.7-.8-2.4c-.8-.9-1.7-.9-2.1-1-3-.2-7.5-.2-7.5-.2s-4.6 0-7.6.2c-.5.1-1.6.1-2.4 1C.7 4.5.5 6.2.5 6.2S.3 8 .3 9.8v4.4c0 1.8.2 3.6.2 3.6s.2 1.7.8 2.4c.8.9 1.9.9 2.3 1 1.7.1 7.5.2 7.5.2s4.6 0 7.6-.2c.5-.1 1.6-.1 2.4-1 .6-.7.8-2.4.8-2.4s.2-1.8.2-3.6V9.8c0-1.8-.2-3.6-.2-3.6z"/>
      <path fill="#fff" d="M10 15.5l5.5-3.5L10 8.5v7z"/>
    </svg>
  );
}

function IconReddit({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="#FF4500" d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12z"/>
      <path fill="#fff" d="M7.4 11.2c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm9.2 0c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zM12 16.2c-1.9 0-3.6-.8-4.8-2.1-.2-.2-.2-.6 0-.8.2-.2.6-.2.8 0 1 1 2.5 1.6 4 1.6s3-.6 4-1.6c.2-.2.6-.2.8 0 .2.2.2.6 0 .8-1.2 1.3-2.9 2.1-4.8 2.1zM17.9 8.2c-.1 0-.3 0-.4-.1-.5-.1-.9-.1-1.2.1-.8-1.2-2.2-2-3.8-2.1l.8-3.6 2.5.6c0 1.4 1.1 2.5 2.5 2.5.6 0 1.1-.2 1.5-.5.2-.1.5 0 .6.2.1.2 0 .5-.2.7-.6.7-1.9 1.9-2.8 2.2-.1 0-.2.1-.3.1z"/>
    </svg>
  );
}

function IconTrends({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="#243a69" d="M3 17h3l4-8 6 6 5-10v12H3z" />
    </svg>
  );
}

function smallNumber(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return String(v);
  }
  return String(v);
}

export default function PlatformBreakdown({ item = {} }) {
  // possíveis campos: item.volume_youtube, item.volume_reddit, item.trends_index
  // ou item.platforms = { youtube: X, reddit: Y, trends: Z }
  const p = item.platforms && typeof item.platforms === 'object' ? item.platforms : null;

  const youtube = p ? (p.youtube ?? p.yt ?? null) : (item.volume_youtube ?? item.youtube ?? null);
  const reddit = p ? (p.reddit ?? null) : (item.volume_reddit ?? item.reddit ?? null);
  const trends = p ? (p.trends ?? null) : (item.trends_index ?? item.trends ?? null);

  const badgeStyle = {
    display: 'inline-flex',
    gap: 8,
    alignItems: 'center',
    padding: '6px 8px',
    borderRadius: 999,
    background: 'rgba(36,58,105,0.06)',
    color: '#243a69',
    fontWeight: 700,
    fontSize: 13,
    border: '1px solid rgba(36,58,105,0.08)'
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <div title="YouTube" style={badgeStyle}>
        <IconYouTube /> <span style={{ marginLeft: 2 }}>{smallNumber(youtube)}</span>
      </div>

      <div title="Reddit" style={badgeStyle}>
        <IconReddit /> <span style={{ marginLeft: 2 }}>{smallNumber(reddit)}</span>
      </div>

      <div title="Google Trends (índice)" style={badgeStyle}>
        <IconTrends /> <span style={{ marginLeft: 2 }}>{smallNumber(trends)}</span>
      </div>
    </div>
  );
}
