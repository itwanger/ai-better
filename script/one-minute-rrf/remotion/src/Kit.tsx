import React from 'react';
import {interpolate} from 'remotion';

/** 一分钟科普视频本地动画辅助，沿用共享色板与卡片风格。 */

export const ease = (f: number, at: number, duration = 10) =>
  interpolate(f, [at, at + duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const move = (f: number, at: number, duration = 18) =>
  interpolate(f, [at, at + duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const rise = (p: number): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * 18}px)`,
});

export const panel: React.CSSProperties = {
  background: '#fefdf9',
  border: '3px solid #2150b4',
  borderRadius: 0,
  boxShadow: '16px 16px 0 #dcdee0',
  boxSizing: 'border-box',
};

export const kicker: React.CSSProperties = {
  position: 'absolute',
  fontSize: 30,
  fontWeight: 900,
  whiteSpace: 'nowrap',
};

export const caption: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 850,
  textAlign: 'center',
  whiteSpace: 'nowrap',
};

export const pill = (color: string, filled = false): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 18px',
  border: `3px solid ${color}`,
  borderRadius: 999,
  background: filled ? color : 'transparent',
  color: filled ? 'white' : color,
  fontWeight: 800,
  fontSize: 28,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
});
