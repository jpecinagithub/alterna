// Tesla: brief historical coda — no heavy sim, just a polyphase header
// animation and the minimal timeline. Kept tasteful and short.
import { useMemo, useState } from 'react';
import { useT } from '../i18n';
import { useReducedMotion, useSimClock } from '../hooks';

const PHASE_COLORS = ['#3b82f6', '#f97316', '#22c55e'];
const W = 560;
const H = 110;

export default function Tesla() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [playing] = useState(!reduced);
  const { time } = useSimClock({ playing, speed: 1 });

  // Three phase-shifted sines drifting slowly — a visual nod to polyphase.
  const paths = useMemo(
    () =>
      PHASE_COLORS.map((_, k) => {
        const N = 160;
        let d = '';
        for (let i = 0; i <= N; i++) {
          const cyc = (i / N) * 3 + time * 0.25;
          const v = Math.sin(2 * Math.PI * cyc - (k * 2 * Math.PI) / 3);
          const x = (i / N) * W;
          const y = H / 2 - v * (H / 2 - 14);
          d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
        }
        return d;
      }),
    [time],
  );

  return (
    <div>
      <div role="img" aria-label={t.tesla.title}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: 'block', background: '#0a1120', borderRadius: 10 }}
        >
          <line
            x1={0}
            y1={H / 2}
            x2={W}
            y2={H / 2}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1}
            strokeDasharray="5 4"
          />
          {paths.map((d, k) => (
            <path
              key={k}
              d={d}
              fill="none"
              stroke={PHASE_COLORS[k]}
              strokeWidth={2.5}
              strokeLinejoin="round"
              opacity={0.9}
            />
          ))}
        </svg>
      </div>

      <h4 style={{ color: '#e8eefb', margin: '20px 0 10px', fontSize: 15, fontWeight: 700 }}>
        {t.tesla.timelineTitle}
      </h4>
      {/* .timeline is light-themed; override inline for the dark lab panel */}
      <div className="timeline" style={{ borderLeftColor: 'rgba(255,255,255,0.18)' }}>
        {t.tesla.timeline.map((item, i) => (
          <div className="t-item" key={`${item.y}-${i}`}>
            <div className="t-year" style={{ color: '#8fb3ff' }}>
              {item.y}
            </div>
            <p style={{ color: '#c6d2ea' }}>{item.t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
