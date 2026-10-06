// Electrons — CC drift vs AC oscillation in a wire.
// Honest scale note: real drift/oscillation is microscopic; motion shown x1000.
import { useState } from 'react';
import { useT } from '../i18n';
import { Seg } from '../components/ui';
import { useSimClock, useReducedMotion } from '../hooks';

type Mode = 'cc' | 'ca';

const N = 24;
const X0 = 28;
const SPAN = 504;
const DRIFT_V = 45; // px per sim-second, CC
const AC_F = 2; // representative visual frequency, Hz (50 Hz shown slowed x25)
const AC_A = 26; // oscillation amplitude, px

export default function Electrons() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<Mode>('cc');
  const { time } = useSimClock({ playing: !reduced, speed: 1 });

  const modeLabel = mode === 'cc' ? t.electrons.modeCC : t.electrons.modeCA;

  const dots = Array.from({ length: N }, (_, i) => {
    const base = X0 + (i * SPAN) / N;
    const x =
      mode === 'cc'
        ? X0 + ((base - X0 + DRIFT_V * time) % SPAN)
        : base + AC_A * Math.sin(2 * Math.PI * AC_F * time + i * 0.35);
    return { i, x };
  });

  return (
    <div>
      <Seg<Mode>
        ariaLabel={t.electrons.title}
        value={mode}
        onChange={setMode}
        options={[
          { value: 'cc', label: t.electrons.cc },
          { value: 'ca', label: t.electrons.ca },
        ]}
      />

      <div role="img" aria-label={modeLabel} style={{ marginTop: 14 }}>
        <svg viewBox="0 0 560 160" width="100%" style={{ display: 'block' }}>
          {/* wire */}
          <rect x={10} y={58} width={540} height={44} rx={22} fill="#16223a" stroke="rgba(255,255,255,0.14)" />
          {dots.map((d) => (
            <circle key={d.i} cx={d.x} cy={80} r={8} fill="#3b82f6" stroke="#dbe7ff" strokeWidth={1} />
          ))}
        </svg>
      </div>

      {/* direction arrows as text: never color-only */}
      <div style={{ fontSize: 26, letterSpacing: 6, margin: '10px 0 2px', color: '#e8eefb' }} aria-hidden="true">
        {mode === 'cc' ? '→ → → → →' : '↔ ↔ ↔ ↔ ↔'}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#e8eefb' }}>{modeLabel}</div>

      {mode === 'ca' && (
        <p className="hint">
          {t.common.slowmo} ×25 · {t.electrons.zoomNote}
        </p>
      )}
    </div>
  );
}
