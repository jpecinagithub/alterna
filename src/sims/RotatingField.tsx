// RotatingField: three coils at 120° with three phase-shifted currents.
// The resultant field is computed as a true vector sum of the active coil
// fields, so 3 phases rotate cleanly, 2 rotate elliptically (pulsing length),
// 1 phase just pulsates along its axis, and 0 phases show nothing.
import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { Seg, Slider, TimeControls } from '../components/ui';
import { useReducedMotion, useSimClock } from '../hooks';
import { clamp } from '../physics';

const CX = 280;
const CY = 190;
const COIL_R = 120;
const ARROW_R = 88;
const FREQ = 0.5; // Hz, visual frequency
const PHASE_COLORS = ['#3b82f6', '#f97316', '#22c55e'];
const PHASE_LETTERS = ['A', 'B', 'C'];
// Coil axis angles in screen coords (y down, clockwise positive): 90°, 210°, 330°.
const COIL_ANGLES = [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3];

function wavePath(k: number, w: number, h: number): string {
  const N = 160;
  const amp = h / 2 - 12;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const cyc = (i / N) * 2;
    const v = Math.sin(2 * Math.PI * cyc - (k * 2 * Math.PI) / 3);
    d += `${i === 0 ? 'M' : 'L'}${((i / N) * w).toFixed(1)} ${(h / 2 - v * amp).toFixed(1)} `;
  }
  return d;
}

function angDiff(a: number, b: number): number {
  return ((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}

function arrowHeadPoints(cx: number, cy: number, ang: number, len: number): string {
  const tx = cx + len * Math.cos(ang);
  const ty = cy + len * Math.sin(ang);
  const bx = cx + (len - 16) * Math.cos(ang);
  const by = cy + (len - 16) * Math.sin(ang);
  const px = Math.cos(ang + Math.PI / 2);
  const py = Math.sin(ang + Math.PI / 2);
  return (
    `${tx.toFixed(1)},${ty.toFixed(1)} ` +
    `${(bx + px * 9).toFixed(1)},${(by + py * 9).toFixed(1)} ` +
    `${(bx - px * 9).toFixed(1)},${(by - py * 9).toFixed(1)}`
  );
}

export default function RotatingField() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(!reduced);
  const [speed, setSpeed] = useState(1);
  const { time } = useSimClock({ playing, speed });
  const [scrub, setScrub] = useState(0); // manual phase offset, in cycles 0..2
  const [mode, setMode] = useState<'together' | 'separate'>('together');
  const [on, setOn] = useState<boolean[]>([true, true, true]);
  const [rotor, setRotor] = useState(0); // rotor angle, screen-coord radians

  const theta = 2 * Math.PI * (FREQ * time + scrub);

  // Resultant field = honest vector sum of active coil contributions.
  let fx = 0;
  let fy = 0;
  const activeIdx: number[] = [];
  on.forEach((active, k) => {
    if (!active) return;
    activeIdx.push(k);
    const v = Math.sin(theta - (k * 2 * Math.PI) / 3);
    fx += v * Math.cos(COIL_ANGLES[k]);
    fy += v * Math.sin(COIL_ANGLES[k]);
  });
  const n = activeIdx.length;
  const mag = Math.hypot(fx, fy);
  const phi = Math.atan2(fy, fx);
  const arrowLen = ARROW_R * clamp(mag / 1.5, 0, 1);

  // Rotor chases the field with lag. On a single phase it only jiggles
  // around the coil axis (no net rotation).
  useEffect(() => {
    if (n === 0) return;
    const axis = COIL_ANGLES[activeIdx[0] ?? 0];
    const target = n === 1 ? axis + 0.22 * Math.sin(theta) : phi;
    const gain = n === 1 ? 0.04 : 0.12;
    setRotor((prev) => prev + angDiff(target, prev) * gain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theta, n, phi]);

  const coils = COIL_ANGLES.map((a, k) => {
    const x = CX + COIL_R * Math.cos(a);
    const y = CY + COIL_R * Math.sin(a);
    const v = Math.sin(theta - (k * 2 * Math.PI) / 3);
    return {
      k,
      x,
      y,
      deg: (a * 180) / Math.PI,
      v,
      active: on[k],
      dir: v >= 0 ? 1 : -1,
      alen: 16 + 14 * Math.abs(v),
      lx: x + Math.cos(a) * 42,
      ly: y + Math.sin(a) * 42,
    };
  });

  const cursorX = (((FREQ * time + scrub) % 2) / 2) * 560;
  const flowChips = t.rotfield.flowTitle.split('→').map((s) => s.trim());

  return (
    <div>
      {/* ---------------- scene ---------------- */}
      <svg
        viewBox="0 0 560 420"
        width="100%"
        role="img"
        aria-label={t.rotfield.title}
        style={{ display: 'block', background: '#0a1120', borderRadius: 12 }}
      >
        <circle cx={CX} cy={CY} r={ARROW_R} fill="none" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 5" />

        {/* coils */}
        {coils.map((c) => (
          <g key={c.k}>
            <g transform={`translate(${c.x.toFixed(1)},${c.y.toFixed(1)}) rotate(${c.deg.toFixed(1)})`}>
              <line x1={-22} y1={0} x2={22} y2={0} stroke="#8a5a2b" strokeWidth={2} />
              {[-13, 0, 13].map((lx) => (
                <ellipse
                  key={lx}
                  cx={lx}
                  cy={0}
                  rx={5.5}
                  ry={17}
                  fill={c.active ? 'rgba(196,123,58,0.12)' : 'rgba(255,255,255,0.03)'}
                  stroke={c.active ? '#c47b3a' : '#4a5568'}
                  strokeWidth={3.5}
                />
              ))}
              {c.active && (
                <g>
                  <line x1={0} y1={0} x2={c.dir * c.alen} y2={0} stroke="#e8eefb" strokeWidth={2.5} />
                  <polygon
                    points={`${(c.dir * c.alen).toFixed(1)},0 ${(c.dir * (c.alen - 7)).toFixed(1)},-4.5 ${(c.dir * (c.alen - 7)).toFixed(1)},4.5`}
                    fill="#e8eefb"
                  />
                </g>
              )}
            </g>
            <text
              x={c.lx.toFixed(1)}
              y={c.ly.toFixed(1)}
              textAnchor="middle"
              dominantBaseline="central"
              fill={PHASE_COLORS[c.k]}
              fontSize={13}
              fontWeight={800}
            >
              {t.rotfield.phase} {PHASE_LETTERS[c.k]}
            </text>
          </g>
        ))}

        {/* resultant field arrow */}
        {n > 0 && arrowLen > 1 && (
          <g>
            <line
              x1={CX}
              y1={CY}
              x2={CX + arrowLen * Math.cos(phi)}
              y2={CY + arrowLen * Math.sin(phi)}
              stroke="#f59e0b"
              strokeWidth={10}
              strokeLinecap="round"
            />
            <polygon points={arrowHeadPoints(CX, CY, phi, arrowLen)} fill="#f59e0b" />
          </g>
        )}

        {/* rotor follows the field */}
        <g transform={`translate(${CX},${CY}) rotate(${((rotor * 180) / Math.PI).toFixed(1)})`}>
          <rect x={-38} y={-7.5} width={76} height={15} rx={7.5} fill="#9aa5b8" stroke="#5b6478" strokeWidth={1.5} />
          <circle cx={-28} cy={0} r={4.5} fill="#3b82f6" />
          <circle cx={28} cy={0} r={4.5} fill="#ef4444" />
        </g>
        <circle cx={CX} cy={CY} r={7} fill="#1c2740" stroke="#e8eefb" strokeWidth={2} />
      </svg>

      <div className="hint">{t.rotfield.rotorNote}</div>
      {(n === 3 || n === 1) && (
        <div className="hint" role="status">
          <strong>{n === 3 ? t.rotfield.threePhaseNote : t.rotfield.onePhaseNote}</strong>
        </div>
      )}

      {/* ---------------- controls ---------------- */}
      <TimeControls
        playing={playing}
        onToggle={() => setPlaying((p) => !p)}
        speed={speed}
        onSpeed={setSpeed}
        speeds={[0.1, 1]}
      />
      <Slider
        label={t.rotfield.dragTime}
        value={scrub}
        min={0}
        max={2}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => {
          setScrub(v);
          setPlaying(false);
        }}
      />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
        <Seg
          options={[
            { value: 'together' as const, label: t.rotfield.together },
            { value: 'separate' as const, label: t.rotfield.separate },
          ]}
          value={mode}
          onChange={setMode}
          ariaLabel={t.rotfield.phase}
        />
        <div role="group" aria-label={t.rotfield.onOff} style={{ display: 'flex', gap: 6 }}>
          {PHASE_LETTERS.map((L, k) => (
            <button
              key={L}
              className={`tbtn ${on[k] ? 'on' : ''}`}
              aria-pressed={on[k]}
              aria-label={`${t.rotfield.phase} ${L} — ${t.rotfield.onOff}`}
              onClick={() => setOn((prev) => prev.map((v, i) => (i === k ? !v : v)))}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: PHASE_COLORS[k],
                  display: 'inline-block',
                }}
              />
              {L}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- phase waves ---------------- */}
      {mode === 'together' ? (
        <div role="img" aria-label={`${t.rotfield.phase}: A, B, C`} style={{ marginTop: 12 }}>
          <svg viewBox="0 0 560 110" width="100%" style={{ display: 'block', background: '#0a1120', borderRadius: 10 }}>
            <line x1={0} y1={55} x2={560} y2={55} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="5 4" />
            <text x={8} y={16} fill="#93a1bd" fontSize={12}>+</text>
            <text x={8} y={102} fill="#93a1bd" fontSize={12}>−</text>
            {PHASE_COLORS.map((c, k) => {
              const yEnd = 55 - Math.sin(4 * Math.PI - (k * 2 * Math.PI) / 3) * 43;
              return (
                <g key={k} opacity={on[k] ? 1 : 0.12}>
                  <path d={wavePath(k, 560, 110)} fill="none" stroke={c} strokeWidth={2.5} strokeLinejoin="round" />
                  <text x={546} y={yEnd + 4} fill={c} fontSize={13} fontWeight={800}>
                    {PHASE_LETTERS[k]}
                  </text>
                </g>
              );
            })}
            <line x1={cursorX} y1={0} x2={cursorX} y2={110} stroke="#fff" strokeWidth={1.5} opacity={0.6} />
          </svg>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {PHASE_COLORS.map((c, k) => (
            <div key={k} role="img" aria-label={`${t.rotfield.phase} ${PHASE_LETTERS[k]}`}>
              <div style={{ fontSize: 12, color: c, fontWeight: 700, marginBottom: 4 }}>
                {t.rotfield.phase} {PHASE_LETTERS[k]}
              </div>
              <svg viewBox="0 0 560 46" width="100%" style={{ display: 'block', background: '#0a1120', borderRadius: 10 }}>
                <line x1={0} y1={23} x2={560} y2={23} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="5 4" />
                <g opacity={on[k] ? 1 : 0.12}>
                  <path d={wavePath(k, 560, 46)} fill="none" stroke={c} strokeWidth={2.5} strokeLinejoin="round" />
                </g>
                <line x1={cursorX} y1={0} x2={cursorX} y2={46} stroke="#fff" strokeWidth={1.5} opacity={0.6} />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- flow strip ---------------- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        {flowChips.map((chip, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 999,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 700,
                color: '#e8eefb',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              {chip}
            </span>
            {i < flowChips.length - 1 && (
              <span style={{ color: '#f59e0b', fontWeight: 800 }} aria-hidden="true">
                →
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
