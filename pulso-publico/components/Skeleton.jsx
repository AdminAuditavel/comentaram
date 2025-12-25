
import React from 'react';

/**
 * Skeleton - placeholder simples reutilizável
 * props:
 *  - width (string|number) optional
 *  - height (string|number) optional
 *  - circle (boolean) optional
 */
export default function Skeleton({ width = '100%', height = 12, circle = false, style = {} }) {
  const base = {
    background: 'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.02), rgba(0,0,0,0.04))',
    borderRadius: circle ? '50%' : 6,
    width,
    height,
    display: 'inline-block',
    ...style,
  };

  return <div aria-hidden="true" style={base} />;
}
