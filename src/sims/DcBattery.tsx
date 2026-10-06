// Chapter 01 — DC intuition: battery, switch, bulb and drifting electrons.
// Electrons drift clockwise around the loop only while the switch is ON.
import { useState } from 'react';
import { useT } from '../i18n';
import { useSimClock, useReducedMotion } from '../hooks';

/* Loop geometry: rounded rect the electrons travel on (clockwise). */
const LX0 = 60;
const LY0 = 60;
const LX1 = 500;
const LY1 = 240;
const LR = 26;
const N_ELECTRONS = 22;
const DRIFT_LOOPS_PER_SEC = 0.045;
const BULB = { x: 500, y: 150, r: 26 };

function loopPoint(t: number): { x: number; y: number } {
  const sw = LX1 - LX0 - 2 * LR;
  const sh = LY1 - LY0 - 2 * LR;
  const arc = (Math.PI / 2) * LR;
  const total = 2 * sw + 2 * sh + 4 * arc;
  let d = ((((t % 1) + 1) % 1) * total);
  if (d < sw) return { x: LX0 + LR + d, y: LY0 }; // top: left -> right
  d -= sw;
  if (d < arc) {
    const a = -Math.PI / 2 + (d / arc) * (Math.PI / 2);
    return { x: LX1 - LR + LR * Math.cos(a), y: LY0 + LR + LR * Math.sin(a) };
  }
  d -= arc;
  if (d < sh) return { x: LX1, y: LY0 + LR + d }; // right: top -> bottom
  d -= sh;
  if (d < arc) {
    const a = (d / arc) * (Math.PI / 2);
    return { x: LX1 - LR + LR * Math.cos(a), y: LY1 - LR + LR * Math.sin(a) };
  }
  d -= arc;
  if (d < sw) return { x: LX1 - LR - d, y: LY1 }; // bottom: right -> left
  d -= sw;
  if (d < arc) {
    const a = Math.PI / 2 + (d / arc) * (Math.PI / 2);
    return { x: LX0 + LR + LR * Math.cos(a), y: LY1 - LR + LR * Math.sin(a) };
  }
  d -= sh;
  if (d < sh) return { x: LX0, y: LY1 - LR - d }; // left: bottom -> top
  d -= sh;
  const a = Math.PI + (d / arc) * (Math.PI / 2);
  return { x: LX0 + LR + LR * Math.cos(a), y: LY0 + LR + LR * Math.sin(a) };
}

export default function DcBattery() {
  const { t } = useT();
  const [on, setOn] = useState(false);
  const reduced = useReducedMotion();
  const { time } = useSimClock({ playing: on, speed: 1 });

  const toggle = () => setOn((o) => !o);
  const drift = on ? DRIFT_LOOPS_PER_SEC * (reduced ? 0.5 : 1) : 0;

  const electrons = [];
  for (let i = 0; i < N_ELECTRONS; i++) {
    const p = loopPoint(i / N_ELECTRONS + time * drift);
    const dx = p.x - BULB.x;
    const dy = p.y - BULB.y;
    if (dx * dx + dy * dy < 34 * 34) continue; // hidden behind the bulb
    const jitter = on ? 0 : (i % 2 === 0 ? 1.3 : -1.3);
    electrons.push(
      <circle
        key={i}
        cx={p.x}
        cy={p.y + jitter}
        r={4}
        fill="#5aa2ff"
        stroke="#0b1526"
        strokeWidth={1}
      />,
    );
  }

  // Switch blade: pivot at (262,60); open = lifted 32 degrees.
  const pivot = { x: 262, y: 60 };
  const bladeLen = 56;
  const bladeAng = on ? 0 : (-32 * Math.PI) / 180;
  const bladeEnd = {
    x: pivot.x + bladeLen * Math.cos(bladeAng),
    y: pivot.y + bladeLen * Math.sin(bladeAng),
  };

  const bulbLabel = on ? t.dc.bulbOn : t.dc.bulbOff;

  return (
    <div>
      <svg
        viewBox="0 0 560 300"
        width="100%"
        style={{ display: 'block', height: 'auto', touchAction: 'none' }}
        role="img"
        aria-label={t.dc.title}
      >
        <defs>
          <radialGradient id="dcBulbHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* wire loop (drawn in segments around battery / switch / bulb) */}
        <g stroke="#aeb9d1" strokeWidth={7} strokeLinecap="round" fill="none">
          {/* bottom */}
          <path d={`M ${LX0 + LR} ${LY1} L ${LX1 - LR} ${LY1}`} />
          {/* top-left corner: battery stub up to the top wire */}
          <path d={`M ${LX0} 96 L ${LX0} ${LY0 + LR} Q ${LX0} ${LY0} ${LX0 + LR} ${LY0}`} />
          {/* top around switch */}
          <path d={`M ${LX0 + LR} ${LY0} L 256 ${LY0}`} />
          <path d={`M 324 ${LY0} L ${LX1 - LR} ${LY0}`} />
          <path d={`M ${LX1 - LR} ${LY0} Q ${LX1} ${LY0} ${LX1} ${LY0 + LR}`} />
          {/* right side around bulb */}
          <path d={`M ${LX1} ${LY0 + LR} L ${LX1} 116`} />
          <path d={`M ${LX1} 184 L ${LX1} ${LY1 - LR}`} />
          <path d={`M ${LX1} ${LY1 - LR} Q ${LX1} ${LY1} ${LX1 - LR} ${LY1}`} />
        </g>
        {/* battery stubs + plates on the left wire */}
        <g stroke="#aeb9d1" strokeWidth={7} strokeLinecap="round" fill="none">
          <line x1={LX0} y1={96} x2={LX0} y2={136} />
          <line x1={LX0} y1={164} x2={LX0} y2={204} />
          <path d={`M ${LX0} 204 L ${LX0} ${LY1 - LR} Q ${LX0} ${LY1} ${LX0 + LR} ${LY1}`} />
        </g>
        {/* battery plates: long = +, short = - */}
        <line x1={50} y1={138} x2={70} y2={138} stroke="#e8eefb" strokeWidth={5} strokeLinecap="round" />
        <line x1={55} y1={162} x2={65} y2={162} stroke="#e8eefb" strokeWidth={5} strokeLinecap="round" />
        <text x={40} y={143} fill="#e8eefb" fontSize={17} fontWeight={800} textAnchor="middle">+</text>
        <text x={40} y={167} fill="#e8eefb" fontSize={17} fontWeight={800} textAnchor="middle">−</text>

        {/* electrons */}
        <g>{electrons}</g>

        {/* switch on the top wire (visual; the accessible control is the button below) */}
        <g onClick={toggle} style={{ cursor: 'pointer' }} aria-hidden="true">
          <circle cx={pivot.x} cy={pivot.y} r={5} fill="#e8eefb" />
          <circle cx={318} cy={pivot.y} r={4.5} fill="#e8eefb" />
          <line
            x1={pivot.x}
            y1={pivot.y}
            x2={bladeEnd.x}
            y2={bladeEnd.y}
            stroke="#e8eefb"
            strokeWidth={6}
            strokeLinecap="round"
          />
        </g>

        {/* bulb */}
        {on && <circle cx={BULB.x} cy={BULB.y} r={52} fill="url(#dcBulbHalo)" />}
        <line x1={LX1} y1={116} x2={LX1} y2={124} stroke="#aeb9d1" strokeWidth={7} />
        <line x1={LX1} y1={176} x2={LX1} y2={184} stroke="#aeb9d1" strokeWidth={7} />
        <circle
          cx={BULB.x}
          cy={BULB.y}
          r={BULB.r}
          fill={on ? 'rgba(252,211,77,0.28)' : 'rgba(255,255,255,0.05)'}
          stroke={on ? '#fbbf24' : '#64748b'}
          strokeWidth={3}
        />
        <polyline
          points="490,150 494,141 498,150 502,141 506,150 510,141"
          fill="none"
          stroke={on ? '#fbbf24' : '#64748b'}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1={496} y1={150} x2={496} y2={164} stroke={on ? '#fbbf24' : '#64748b'} strokeWidth={2.5} />
        <line x1={504} y1={150} x2={504} y2={164} stroke={on ? '#fbbf24' : '#64748b'} strokeWidth={2.5} />
        <text
          x={BULB.x}
          y={BULB.y + BULB.r + 20}
          textAnchor="middle"
          fill={on ? '#fbbf24' : '#93a1bd'}
          fontSize={13}
          fontWeight={700}
        >
          {bulbLabel}
        </text>

        {/* drift direction arrows on the top wire (shown when ON) */}
        {on && (
          <g fill="#5aa2ff" fontSize={15} fontWeight={800}>
            <text x={150} y={52} textAnchor="middle">→</text>
            <text x={380} y={52} textAnchor="middle">→</text>
            <text x={150} y={262} textAnchor="middle">←</text>
            <text x={380} y={262} textAnchor="middle">←</text>
          </g>
        )}
      </svg>

      <div className="hint" role="status" aria-live="polite" style={{ marginTop: 10 }}>
        {on ? t.dc.fieldOn : t.dc.fieldOff}
      </div>

      {on && (
        <div
          style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(90,162,255,0.14)',
            border: '1px solid #5aa2ff',
            color: '#9cc2ff',
            fontWeight: 800,
            letterSpacing: 1.5,
            fontSize: 14,
          }}
        >
          {t.dc.dcLabel}
        </div>
      )}

      <div className="timebar">
        <button
          type="button"
          className={`tbtn ${on ? 'on' : ''}`}
          onClick={toggle}
          aria-pressed={on}
          aria-label={`${t.dc.switchLabel}: ${on ? t.common.on : t.common.off}`}
        >
          {t.dc.switchLabel}: {on ? t.common.on : t.common.off}
        </button>
      </div>

      <p className="hint" role="status">
        {bulbLabel}
      </p>
    </div>
  );
}
