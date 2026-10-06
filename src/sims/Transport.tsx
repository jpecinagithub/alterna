// Transport: high-voltage power-line simulator.
// Illustrative model (honest about it): I = P/V (relative units), R ∝ distance,
// loss fraction ∝ I²·R, clamped. Defaults tuned to show ≈ 8% losses.
import { useState } from 'react';
import { useT } from '../i18n';
import { Slider } from '../components/ui';
import { useReducedMotion, useSimClock } from '../hooks';
import { clamp } from '../physics';

interface Pt {
  x: number;
  y: number;
}
interface Span {
  p0: Pt;
  c: Pt;
  p1: Pt;
}

const TOWER_X = [195, 315, 435];
const TOWER_TOP = 118;
const GROUND = 265;

// Catenary spans: plant → 3 pylons → city (quadratic beziers).
const SPANS: Span[] = [
  { p0: { x: 105, y: 158 }, c: { x: 150, y: 158 }, p1: { x: 195, y: TOWER_TOP } },
  { p0: { x: 195, y: TOWER_TOP }, c: { x: 255, y: 158 }, p1: { x: 315, y: TOWER_TOP } },
  { p0: { x: 315, y: TOWER_TOP }, c: { x: 375, y: 158 }, p1: { x: 435, y: TOWER_TOP } },
  { p0: { x: 435, y: TOWER_TOP }, c: { x: 472, y: 158 }, p1: { x: 508, y: 142 } },
];
const WIRE_DY = [0, 14];

const BUILDINGS = [
  { x: 442, y: 182, w: 32, h: 83 },
  { x: 479, y: 160, w: 36, h: 105 },
  { x: 520, y: 196, w: 30, h: 69 },
];

function bez(s: Span, u: number): Pt {
  const v = 1 - u;
  return {
    x: v * v * s.p0.x + 2 * v * u * s.c.x + u * u * s.p1.x,
    y: v * v * s.p0.y + 2 * v * u * s.c.y + u * u * s.p1.y,
  };
}

function spanPath(s: Span, dy: number): string {
  return `M ${s.p0.x} ${s.p0.y + dy} Q ${s.c.x} ${s.c.y + dy} ${s.p1.x} ${s.p1.y + dy}`;
}

function hexLerp(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  return (
    '#' +
    pa
      .map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0'))
      .join('')
  );
}

export default function Transport() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [playing] = useState(!reduced);
  const { time } = useSimClock({ playing, speed: 1 });

  const [distance, setDistance] = useState(100);
  const [voltage, setVoltage] = useState(220);
  const [power, setPower] = useState(100);

  // Illustrative physics: I = P/V, R ∝ distance, losses ∝ I²·R.
  const lossFrac = clamp(0.4 * (power / voltage) ** 2 * (distance / 100), 0, 0.6);
  const lostPct = lossFrac * 100;
  const deliveredPct = 100 - lostPct;
  const wireColor = hexLerp('#3b82f6', '#ef4444', lossFrac / 0.6);

  // Energy packets flowing along both wires (direction = left → right).
  const packets: Pt[] = [];
  const PER_WIRE = 8;
  WIRE_DY.forEach((dy, w) => {
    for (let k = 0; k < PER_WIRE; k++) {
      const ug = (time * 0.12 + (w * 0.5 + k) / PER_WIRE) % 1;
      const si = Math.min(SPANS.length - 1, Math.floor(ug * SPANS.length));
      const p = bez(SPANS[si], ug * SPANS.length - si);
      packets.push({ x: p.x, y: p.y + dy });
    }
  });

  // Heat shimmer above the wire: more squiggles + stronger as losses grow.
  const shimmers: Pt[] = [];
  const shimmerCount = Math.round(lossFrac * 10);
  for (let i = 0; i < shimmerCount; i++) {
    const si = i % SPANS.length;
    const p = bez(SPANS[si], 0.25 + 0.5 * ((i * 0.37) % 1));
    shimmers.push({ x: p.x, y: p.y - 16 - (i % 3) * 6 });
  }

  const stats = [
    { label: t.transport.produced, value: '100%', color: '#e8eefb' },
    { label: t.transport.lost, value: `${lostPct.toFixed(1)}%`, color: '#f87171' },
    { label: t.transport.delivered, value: `${deliveredPct.toFixed(1)}%`, color: '#4ade80' },
  ];

  return (
    <div>
      <svg
        viewBox="0 0 560 300"
        width="100%"
        role="img"
        aria-label={`${t.transport.plantLabel} → ${t.transport.cityLabel}`}
        style={{ display: 'block', background: '#0a1120', borderRadius: 12 }}
      >
        <defs>
          <marker id="pkt-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#e8eefb" opacity="0.85" />
          </marker>
        </defs>

        {/* ground */}
        <line x1={0} y1={GROUND} x2={560} y2={GROUND} stroke="#3b4a6b" strokeWidth={2} />

        {/* power plant */}
        <g>
          <rect x={30} y={190} width={76} height={75} fill="#26314d" stroke="#3b4a6b" strokeWidth={1.5} />
          <rect x={40} y={148} width={16} height={46} fill="#26314d" stroke="#3b4a6b" strokeWidth={1.5} />
          <rect x={62} y={162} width={14} height={32} fill="#26314d" stroke="#3b4a6b" strokeWidth={1.5} />
          <rect x={82} y={210} width={14} height={10} fill="#fbbf24" opacity={0.9} />
          <polygon points="70,196 56,226 66,226 58,250 80,220 69,220 76,196" fill="#fbbf24" />
          <text x={68} y={290} textAnchor="middle" fill="#93a1bd" fontSize={13} fontWeight={700}>
            {t.transport.plantLabel}
          </text>
        </g>

        {/* pylons */}
        {TOWER_X.map((x) => (
          <g key={x} stroke="#5b6b8c" strokeWidth={3} fill="none" strokeLinecap="round">
            <path d={`M ${x - 17} ${GROUND} L ${x} ${TOWER_TOP + 6} L ${x + 17} ${GROUND}`} />
            <line x1={x - 24} y1={TOWER_TOP + 8} x2={x + 24} y2={TOWER_TOP + 8} />
            <line x1={x} y1={TOWER_TOP + 6} x2={x} y2={GROUND} />
          </g>
        ))}

        {/* wires (cool → hot with losses) */}
        {WIRE_DY.map((dy) => (
          <g key={dy}>
            {SPANS.map((s, i) => (
              <path
                key={i}
                d={spanPath(s, dy)}
                fill="none"
                stroke={wireColor}
                strokeWidth={3}
                markerEnd="url(#pkt-arrow)"
              />
            ))}
          </g>
        ))}

        {/* heat shimmer */}
        {shimmers.map((p, i) => (
          <path
            key={i}
            d={`M ${p.x.toFixed(1)} ${p.y.toFixed(1)} q 3 -6 6 0 t 6 0`}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.25 + 0.6 * (lossFrac / 0.6)}
          />
        ))}

        {/* energy packets */}
        {packets.map((p, i) => (
          <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={4.5} fill="#fbbf24" stroke="#fff" strokeWidth={1} />
        ))}

        {/* city */}
        {BUILDINGS.map((b, bi) => (
          <g key={bi}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#2b3a58" stroke="#4a5f8a" strokeWidth={1.5} />
            {Array.from({ length: 3 }).map((_, r) =>
              Array.from({ length: Math.floor(b.w / 12) }).map((_, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={b.x + 6 + c * 12}
                  y={b.y + 10 + r * 18}
                  width={6}
                  height={8}
                  fill={(r * 2 + c + bi) % 3 === 0 ? '#3a4a68' : '#ffd166'}
                />
              )),
            )}
          </g>
        ))}
        <text x={487} y={290} textAnchor="middle" fill="#93a1bd" fontSize={13} fontWeight={700}>
          {t.transport.cityLabel}
        </text>
      </svg>

      {/* readouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 14 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <div style={{ fontSize: 12, color: '#93a1bd', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--mono)' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          height: 12,
          borderRadius: 6,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
          display: 'flex',
          marginTop: 10,
        }}
        role="img"
        aria-label={`${t.transport.delivered}: ${deliveredPct.toFixed(1)}%, ${t.transport.lost}: ${lostPct.toFixed(1)}%`}
      >
        <div style={{ width: `${deliveredPct}%`, background: '#22c55e' }} />
        <div style={{ width: `${lostPct}%`, background: '#ef4444' }} />
      </div>

      <div className="hint">
        <code
          style={{
            fontFamily: 'var(--mono)',
            background: 'rgba(255,255,255,0.1)',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 13,
            color: '#e8eefb',
          }}
        >
          {t.transport.lossLaw}
        </code>
      </div>

      <Slider label={t.transport.distance} value={distance} min={10} max={300} step={5} unit="km" onChange={setDistance} />
      <Slider label={t.transport.voltage} value={voltage} min={10} max={400} step={10} unit="kV" onChange={setVoltage} />
      <Slider label={t.transport.power} value={power} min={20} max={200} step={10} unit="MW" onChange={setPower} />
    </div>
  );
}
