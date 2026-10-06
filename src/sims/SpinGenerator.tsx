// SpinGenerator — the "AHA" moment.
// Drag the crank in circles (manual) or let it spin automatically (auto).
// The rotor turns inside a magnetic field, flux changes sign, and a sine
// wave is born: emf(t) = sin(θ) · speedFactor. Spinning backwards inverts it.
import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useT } from '../i18n';
import { Seg } from '../components/ui';
import { useRaf } from '../hooks';
import WaveChart from '../components/WaveChart';
import { clamp } from '../physics';

const CX = 280;
const CY = 150;
const AUTO_W = 2 * Math.PI * 1.2; // 1.2 rev/s in auto mode
const POS = '#3b82f6';
const NEG = '#f97316';

type Mode = 'manual' | 'auto';

export default function SpinGenerator() {
  const { t } = useT();
  const [mode, setMode] = useState<Mode>('manual'); // manual = paused by default (reduced-motion friendly)
  const thetaRef = useRef(0); // accumulated rotor angle, rad
  const dragDeltaRef = useRef(0); // drag deltas waiting to be consumed by the rAF loop
  const omegaRef = useRef(0); // smoothed angular velocity, rad/s
  const chartTimeRef = useRef(0); // wave time kept in phase with θ
  const flowRef = useRef(0); // animated dash offset on the output wire
  const signRef = useRef<1 | -1>(1); // last non-zero emf sign (stable badge, no flicker)
  const dragAngleRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [, setTick] = useState(0);

  const modeRef = useRef(mode);
  modeRef.current = mode;

  useRaf(true, (dt) => {
    let dtheta = dragDeltaRef.current;
    dragDeltaRef.current = 0;
    if (modeRef.current === 'auto') dtheta += AUTO_W * dt;
    thetaRef.current += dtheta;
    const inst = dt > 0 ? dtheta / dt : 0;
    omegaRef.current += (inst - omegaRef.current) * 0.12; // low-pass: smooth speed
    const f = Math.abs(omegaRef.current) / (2 * Math.PI);
    if (f > 0.02) chartTimeRef.current += dtheta / (2 * Math.PI * f);
    const emfNow =
      Math.sin(thetaRef.current) * clamp(Math.abs(omegaRef.current) / 3, 0, 1);
    flowRef.current += dt * emfNow * 60;
    setTick((v) => v + 1);
  });

  const theta = thetaRef.current;
  const omega = omegaRef.current;
  const speedFactor = clamp(Math.abs(omega) / 3, 0, 1);
  const emf = Math.sin(theta) * speedFactor;
  if (emf > 0.03) signRef.current = 1;
  else if (emf < -0.03) signRef.current = -1;
  const positive = signRef.current > 0;
  const deg = Math.round((((theta * 180) / Math.PI) % 360 + 360) % 360);
  const freq = Math.abs(omega) / (2 * Math.PI);
  const amp = Math.min(1, Math.abs(omega) / 3);
  const degStr = ((theta * 180) / Math.PI).toFixed(1);

  const svgAngle = (e: RPointerEvent<SVGCircleElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 560;
    const y = ((e.clientY - rect.top) / rect.height) * 360;
    return Math.atan2(y - CY, x - CX);
  };
  const onDown = (e: RPointerEvent<SVGCircleElement>) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragAngleRef.current = svgAngle(e);
  };
  const onMove = (e: RPointerEvent<SVGCircleElement>) => {
    if (dragAngleRef.current == null) return;
    const a = svgAngle(e);
    let d = a - dragAngleRef.current;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    dragDeltaRef.current += d;
    dragAngleRef.current = a;
  };
  const onUp = () => {
    dragAngleRef.current = null;
  };

  const flowParts = t.spin.flowTitle.split('→').map((s) => s.trim());

  return (
    <div>
      <Seg<Mode>
        ariaLabel={t.spin.title}
        value={mode}
        onChange={setMode}
        options={[
          { value: 'manual', label: t.spin.manual },
          { value: 'auto', label: t.spin.auto },
        ]}
      />

      <svg
        ref={svgRef}
        viewBox="0 0 560 360"
        width="100%"
        role="img"
        aria-label={t.spin.title}
        style={{ display: 'block', marginTop: 14, touchAction: 'none', userSelect: 'none' }}
      >
        <defs>
          <marker
            id="spinFld"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 2 L 10 5 L 0 8" fill="none" stroke="#f59e0b" strokeWidth={1.6} opacity={0.55} />
          </marker>
        </defs>

        {/* static amber field lines across the middle region */}
        {[235, 257, 280, 302, 325].map((x) => (
          <line
            key={x}
            x1={x}
            y1={282}
            x2={x}
            y2={32}
            stroke="#f59e0b"
            strokeWidth={2}
            opacity={0.16}
            markerEnd="url(#spinFld)"
          />
        ))}

        {/* coil sides: two vertical copper bars */}
        <rect x={192} y={60} width={16} height={180} rx={4} fill="#c98a4b" stroke="#7c4f1e" strokeWidth={1.5} />
        <rect x={352} y={60} width={16} height={180} rx={4} fill="#c98a4b" stroke="#7c4f1e" strokeWidth={1.5} />

        {/* output wire with flowing current (dash animation) */}
        <path
          d="M 200 240 L 200 302 L 360 302 L 360 240"
          fill="none"
          stroke="#c98a4b"
          strokeWidth={6}
          strokeLinejoin="round"
        />
        <path
          d="M 200 240 L 200 302 L 360 302 L 360 240"
          fill="none"
          stroke={positive ? POS : NEG}
          strokeWidth={3}
          strokeDasharray="12 10"
          strokeDashoffset={-flowRef.current}
          strokeLinejoin="round"
        />
        {/* polarity labels: text + color, never color alone */}
        <text x={200} y={328} textAnchor="middle" fontSize={17} fontWeight={800} fill={positive ? POS : NEG}>
          {positive ? '+' : '−'}
        </text>
        <text x={360} y={328} textAnchor="middle" fontSize={17} fontWeight={800} fill={positive ? NEG : POS}>
          {positive ? '−' : '+'}
        </text>
        {/* current direction badge: arrow glyph + colored ring */}
        <circle cx={CX} cy={302} r={17} fill="#0f1a30" stroke={positive ? POS : NEG} strokeWidth={2.5} />
        <text
          x={CX}
          y={302}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={20}
          fontWeight={800}
          fill="#fff"
        >
          {positive ? '→' : '←'}
        </text>

        {/* rotor: N (red, top) / S (blue, bottom) halves rotating with θ */}
        <g transform={`translate(${CX} ${CY}) rotate(${degStr})`}>
          <path d="M -55 0 A 55 55 0 0 1 55 0 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth={1.5} />
          <path d="M -55 0 A 55 55 0 0 0 55 0 Z" fill="#3b82f6" stroke="#1e3a8a" strokeWidth={1.5} />
          <text x={0} y={-30} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fff">N</text>
          <text x={0} y={38} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fff">S</text>
          {/* crank arm */}
          <line x1={52 * Math.cos(theta)} y1={52 * Math.sin(theta)} x2={66 * Math.cos(theta)} y2={66 * Math.sin(theta)} stroke="#93a1bd" strokeWidth={7} strokeLinecap="round" />
          <circle cx={66 * Math.cos(theta)} cy={66 * Math.sin(theta)} r={11} fill="#f59e0b" stroke="#92400e" strokeWidth={2.5} />
        </g>
        <circle cx={CX} cy={CY} r={6} fill="#0a1120" stroke="#e8eefb" strokeWidth={2} />

        {/* drag handle: whole disc, manual mode only */}
        {mode === 'manual' && (
          <circle
            cx={CX}
            cy={CY}
            r={92}
            fill="rgba(255,255,255,0)"
            style={{ cursor: 'grab', touchAction: 'none' }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            aria-label={t.spin.dragCrank}
          />
        )}
      </svg>

      <p className="hint">
        <strong>{t.spin.angle}:</strong> {deg}°
      </p>
      {mode === 'manual' && (
        <p className="hint">
          <strong>{t.spin.dragCrank}</strong>
        </p>
      )}

      <WaveChart
        freq={freq}
        amp={amp}
        time={chartTimeRef.current}
        unit="V"
        label={t.common.voltage}
        color="#22d3ee"
        ariaLabel={t.common.voltage}
      />

      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 12 }}
        aria-hidden="true"
      >
        {flowParts.map((p, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span style={{ color: '#f59e0b', fontWeight: 800 }}>→</span>}
            <span
              style={{
                background: '#16233c',
                border: '1px solid #2b3d63',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 12,
                color: '#dbe4f5',
                fontWeight: 600,
              }}
            >
              {p}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
