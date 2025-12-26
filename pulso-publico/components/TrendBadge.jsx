//pulso-publico/components/TrendBadge.jsx
'use client';

import React from 'react';

/**
 * TrendBadge
 * Props:
 *  - direction: 'up'|'down'|'flat'
 *  - value: number
 */
export default function TrendBadge({ direction = 'flat', value = 0 }) {
  const upColor = 'var(--c-3, #74be63)';
  const downColor = '#DC2626';
  const flatColor = 'rgba(0,0,0,0.45)';

  if (direction === 'up') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: upColor, fontWeight: 700 }}>
        ↑ {value}
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: downColor, fontWeight: 700 }}>
        ↓ {value}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: flatColor }}>
      — {value}
    </span>
  );
}
