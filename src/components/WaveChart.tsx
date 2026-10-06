// Reusable SVG oscilloscope-style sine chart. Draws the full wave and a
// moving "now" cursor. Purely presentational: pass freq/amp/time in sim units.
import { useMemo } from 'react';

interface Props {
  freq: number; // Hz of the wave
  amp: number; // peak value (display units)
  time: number; // current sim time in seconds
  windowSec?: number; // seconds of history shown
  height?: number;
  unit?: string;
  color?: string;
  label?: string;
  zeroLine?: boolean;
  ariaLabel?: string;
}

export default function WaveChart({
  freq,
  amp,
  time,
  windowSec,
  height = 150,
  unit = 'V',
  color = '#3b82f6',
  label,
  zeroLine = true,
  ariaLabel,
}: Props) {
  const W = 560;
  const H = height;
  const midY = H / 2;
  const padY = 14;
  const scaleY = (H / 2 - padY) / Math.max(1e-6, Math.abs(amp));

  const win = windowSec ?? Math.max(2 / Math.max(freq, 0.05), 0.5);
  const t0 = time - win;

  const path = useMemo(() => {
    const N = 220;
    let d = '';
    for (let i = 0; i <= N; i++) {
      const tt = t0 + (win * i) / N;
      const v = amp * Math.sin(2 * Math.PI * freq * tt);
      const x = (i / N) * W;
      const y = midY - v * scaleY;
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    return d;
  }, [t0, win, freq, amp, scaleY, midY]);

  // current value marker
  const vNow = amp * Math.sin(2 * Math.PI * freq * time);
  const yNow = midY - vNow * scaleY;

  return (
    <div role="img" aria-label={ariaLabel || label || 'waveform'}>
      {label && (
        <div style={{ fontSize: 12.5, color: '#93a1bd', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', background: '#0a1120', borderRadius: 10 }}>
        {/* grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={W * f} y1={0} x2={W * f} y2={H} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}
        {zeroLine && (
          <line x1={0} y1={midY} x2={W} y2={midY} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="5 4" />
        )}
        <text x={8} y={18} fill="#93a1bd" fontSize={12}>+{unit}</text>
        <text x={8} y={H - 8} fill="#93a1bd" fontSize={12}>−{unit}</text>
        <text x={W - 34} y={midY - 8} fill="#93a1bd" fontSize={12}>0</text>
        <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        {/* now cursor */}
        <line x1={W - 2} y1={0} x2={W - 2} y2={H} stroke="#fff" strokeWidth={1.5} opacity={0.7} />
        <circle cx={W - 2} cy={yNow} r={5} fill={color} stroke="#fff" strokeWidth={1.5} />
      </svg>
    </div>
  );
}
