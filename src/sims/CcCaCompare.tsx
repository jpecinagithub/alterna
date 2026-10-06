// CC vs AC face-to-face: same circuit, two currents. Bulb, resistor, coil,
// transformer. Dots = electrons; direction is never color-only (arrows,
// +/-, and text labels accompany every motion cue).
import { useState } from 'react';
import { useT } from '../i18n';
import { Seg, TimeControls } from '../components/ui';
import { useReducedMotion, useSimClock } from '../hooks';
import WaveChart from '../components/WaveChart';

type Comp = 'bulb' | 'resistor' | 'coil' | 'trafo';
type Mode = 'dc' | 'ac';

const WIRE = { x0: 30, x1: 270, y0: 28, y1: 152 };
const PER = 2 * (240 + 124);
const LAB_BG = '#0e1626';
const DOT = '#7dd3fc';

/** Position along the rectangular wire loop (clockwise). */
function pointAt(d: number): [number, number] {
  const { x0, x1, y0, y1 } = WIRE;
  const w = x1 - x0;
  const h = y1 - y0;
  const per = 2 * (w + h);
  let dd = ((d % per) + per) % per;
  if (dd < w) return [x0 + dd, y0];
  dd -= w;
  if (dd < h) return [x1, y0 + dd];
  dd -= h;
  if (dd < w) return [x1 - dd, y1];
  return [x0, y1 - (dd - w)];
}

function LoadSymbol({ comp, glowId }: { comp: Comp; glowId: string }) {
  if (comp === 'bulb') {
    return (
      <g>
        <rect x={118} y={12} width={64} height={32} rx={6} fill={LAB_BG} />
        <circle cx={150} cy={28} r={26} fill={`url(#${glowId})`} />
        <circle cx={150} cy={28} r={15} fill="#ffd166" stroke="#e8eefb" strokeWidth={2.5} />
        <text x={150} y={33} textAnchor="middle" fontSize={14} fill="#0e1626" fontWeight={700}>✦</text>
      </g>
    );
  }
  if (comp === 'resistor') {
    const pts = '124,28 131,18 139,38 147,18 155,38 163,18 171,38 178,28';
    return (
      <g>
        <rect x={116} y={10} width={70} height={36} rx={6} fill={LAB_BG} />
        <polyline points={pts} fill="none" stroke="#fb923c" strokeWidth={9} opacity={0.45} strokeLinejoin="round" />
        <polyline points={pts} fill="none" stroke="#e8eefb" strokeWidth={2.5} strokeLinejoin="round" />
      </g>
    );
  }
  if (comp === 'coil') {
    return (
      <g>
        <rect x={114} y={10} width={72} height={34} rx={6} fill={LAB_BG} />
        <path
          d="M 123 28 a 9 11 0 0 1 18 0 a 9 11 0 0 1 18 0 a 9 11 0 0 1 18 0"
          fill="none" stroke="#d08a4e" strokeWidth={4}
        />
      </g>
    );
  }
  // trafo: two small coils with a gap
  return (
    <g>
      <rect x={118} y={10} width={68} height={36} rx={6} fill={LAB_BG} />
      <path d="M 128 28 a 6 9 0 0 1 12 0 a 6 9 0 0 1 12 0" fill="none" stroke="#d08a4e" strokeWidth={4} />
      <path d="M 158 28 a 6 9 0 0 1 12 0 a 6 9 0 0 1 12 0" fill="none" stroke="#d08a4e" strokeWidth={4} />
    </g>
  );
}

function SourceSymbol({ mode }: { mode: Mode }) {
  if (mode === 'dc') {
    return (
      <g>
        <rect x={130} y={138} width={40} height={28} rx={6} fill={LAB_BG} />
        <line x1={143} y1={141} x2={143} y2={163} stroke="#e8eefb" strokeWidth={3} />
        <line x1={157} y1={146} x2={157} y2={158} stroke="#e8eefb" strokeWidth={7} />
        <text x={143} y={134} textAnchor="middle" fontSize={13} fill="#e8eefb" fontWeight={700}>+</text>
        <text x={157} y={134} textAnchor="middle" fontSize={13} fill="#e8eefb" fontWeight={700}>−</text>
      </g>
    );
  }
  return (
    <g>
      <circle cx={150} cy={152} r={21} fill={LAB_BG} stroke="#e8eefb" strokeWidth={2.5} />
      <text x={150} y={159} textAnchor="middle" fontSize={18} fill="#e8eefb">∿</text>
    </g>
  );
}

function DirectionMarkers({ mode }: { mode: Mode }) {
  if (mode === 'dc') {
    return (
      <g fill="#e8eefb" aria-hidden="true">
        {/* electrons drift counterclockwise: right along the bottom, left along the top */}
        <polygon points="98,22 86,28 98,34" />
        <polygon points="202,146 214,152 202,158" />
      </g>
    );
  }
  return (
    <g fill="#e8eefb" fontSize={15} fontWeight={700} aria-hidden="true">
      <text x={90} y={22} textAnchor="middle">↔</text>
      <text x={210} y={170} textAnchor="middle">↔</text>
    </g>
  );
}

function Panel({ mode, comp, compLabel, time }: { mode: Mode; comp: Comp; compLabel: string; time: number }) {
  const { t } = useT();
  const glowId = `glow-${mode}`;
  const N = 12;
  const dots: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const base = (i / N) * PER;
    const d = mode === 'dc' ? base - time * 80 : base + 30 * Math.sin(2 * Math.PI * 2 * time);
    dots.push(pointAt(d));
  }
  const header = mode === 'dc' ? `${t.compare.dcSide}  → → →` : `${t.compare.acSide}  ∿ ∿ ∿`;
  const note =
    comp === 'bulb' || comp === 'resistor'
      ? t.compare.worksFine
      : comp === 'coil'
        ? mode === 'dc' ? t.compare.coilDcNote : t.compare.coilAcNote
        : mode === 'dc' ? t.compare.trafoDcNote : t.compare.trafoAcNote;

  return (
    <div style={{ border: '1px solid #1c2942', borderRadius: 12, padding: 12, background: '#0a1222' }}>
      <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.04em', marginBottom: 8 }}>{header}</div>
      <svg viewBox="0 0 300 180" width="100%" role="img" aria-label={`${header} — ${compLabel}`}>
        <defs>
          <radialGradient id={glowId}>
            <stop offset="0%" stopColor="#ffd166" stopOpacity={0.85} />
            <stop offset="100%" stopColor="#ffd166" stopOpacity={0} />
          </radialGradient>
        </defs>
        <path d="M 30 28 H 270 V 152 H 30 Z" fill="none" stroke="#5b6b8c" strokeWidth={3} />
        <DirectionMarkers mode={mode} />
        <SourceSymbol mode={mode} />
        <LoadSymbol comp={comp} glowId={glowId} />
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4} fill={DOT} />
        ))}
      </svg>
      {mode === 'ac' ? (
        <WaveChart freq={2} amp={1} time={time} height={80} unit="V" label={t.compare.acSide} color="#3b82f6" />
      ) : (
        <svg viewBox="0 0 560 80" width="100%" style={{ display: 'block', background: '#0a1120', borderRadius: 10 }} role="img" aria-label={t.compare.dcSide}>
          <line x1={0} y1={52} x2={560} y2={52} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="5 4" />
          <line x1={0} y1={26} x2={560} y2={26} stroke="#3b82f6" strokeWidth={2.5} />
          <text x={8} y={20} fill="#93a1bd" fontSize={12}>+V</text>
          <text x={552} y={46} fill="#93a1bd" fontSize={12} textAnchor="end">0</text>
        </svg>
      )}
      <div className="hint">{note}</div>
    </div>
  );
}

export default function CcCaCompare() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(!reduced);
  const [speed, setSpeed] = useState(1);
  const [comp, setComp] = useState<Comp>('bulb');
  const { time } = useSimClock({ playing, speed });

  const compLabel = comp === 'bulb' ? t.compare.bulb : comp === 'resistor' ? t.compare.resistor : comp === 'coil' ? t.compare.coil : t.compare.transformer;

  return (
    <div className="sim-panel">
      <Seg<Comp>
        ariaLabel={t.compare.title}
        value={comp}
        onChange={setComp}
        options={[
          { value: 'bulb', label: t.compare.bulb },
          { value: 'resistor', label: t.compare.resistor },
          { value: 'coil', label: t.compare.coil },
          { value: 'trafo', label: t.compare.transformer },
        ]}
      />
      <TimeControls playing={playing} onToggle={() => setPlaying((p) => !p)} speed={speed} onSpeed={setSpeed} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
          marginTop: 12,
        }}
      >
        <Panel mode="dc" comp={comp} compLabel={compLabel} time={time} />
        <Panel mode="ac" comp={comp} compLabel={compLabel} time={time} />
      </div>
    </div>
  );
}
