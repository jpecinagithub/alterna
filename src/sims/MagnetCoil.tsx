// Chapter 02 — Induction: drag the magnet through the coil and discover
// that CHANGE of magnetic flux (not magnetism itself) creates electricity.
// emf = -dFlux/dt, galvanometer needle with inertia, live history strip.
import React, { useRef, useState } from 'react';
import { useT } from '../i18n';
import { Slider } from '../components/ui';
import { useRaf, useReducedMotion, useSimClock } from '../hooks';
import { clamp, fluxFromPosition } from '../physics';

const COIL_X = 280;
const COIL_Y = 150;
const MAG_MIN = 80;
const MAG_MAX = 480;
const MAG_W = 110;
const MAG_H = 44;
const GAIN = 6; // emf = -dFlux/dt * GAIN
const EMF_REF = 6; // |emf| that pins the needle / fills the strip
const STOP_VEL = 12; // px/s — below this the magnet counts as stopped
const CHANGE_TH = 0.35; // |emf| above which the CHANGE badge appears
const HIST_SEC = 4;

const startX = 140;

export default function MagnetCoil() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [demo, setDemo] = useState(false);
  const [demoFreq, setDemoFreq] = useState(0.8);
  const [, setFrame] = useState(0);

  const demoRef = useRef(demo);
  const freqRef = useRef(demoFreq);
  demoRef.current = demo;
  freqRef.current = demoFreq;

  const clock = useSimClock({ playing: demo, speed: 1 });
  const clockRef = useRef(clock);
  clockRef.current = clock;

  const magX = useRef(startX);
  const prevX = useRef(startX);
  const prevFlux = useRef(fluxFromPosition(1 - Math.abs(startX - COIL_X) / 220));
  const prevDist = useRef(Math.abs(startX - COIL_X));
  const vel = useRef(0);
  const distVel = useRef(0);
  const emf = useRef(0);
  const needleDeg = useRef(0);
  const samples = useRef<Array<{ t: number; v: number }>>([]);
  const lastFrame = useRef(0);
  const dragging = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useRaf(true, (dt) => {
    const now = performance.now() / 1000;
    if (demoRef.current) {
      const x = COIL_X + 150 * Math.sin(2 * Math.PI * freqRef.current * clockRef.current.time);
      magX.current = clamp(x, MAG_MIN, MAG_MAX);
    }
    const x = magX.current;
    const dist = Math.abs(x - COIL_X);
    const flux = fluxFromPosition(1 - dist / 220);
    const k = Math.min(1, dt * 12);
    vel.current += ((dt > 0 ? (x - prevX.current) / dt : 0) - vel.current) * k;
    distVel.current += ((dt > 0 ? (dist - prevDist.current) / dt : 0) - distVel.current) * k;
    const emfRaw = dt > 0 ? -((flux - prevFlux.current) / dt) * GAIN : 0;
    emf.current += (emfRaw - emf.current) * Math.min(1, dt * 10);
    prevFlux.current = flux;
    prevDist.current = dist;
    prevX.current = x;
    // Needle: approaching -> flux rising -> emf negative -> needle to + (right).
    const target = clamp((-emf.current / EMF_REF) * 60, -60, 60);
    needleDeg.current += (target - needleDeg.current) * Math.min(1, dt * 9);

    const s = samples.current;
    s.push({ t: now, v: emf.current });
    const cutoff = now - HIST_SEC;
    while (s.length > 0 && s[0] !== undefined && s[0].t < cutoff) s.shift();

    if (now - lastFrame.current > 1 / 30) {
      lastFrame.current = now;
      setFrame((f) => f + 1);
    }
  });

  const toSvgX = (clientX: number) => {
    const el = svgRef.current;
    if (!el) return COIL_X;
    const r = el.getBoundingClientRect();
    return clamp(((clientX - r.left) / r.width) * 560, 0, 560);
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    if (!target.closest('[data-magnet]')) return;
    dragging.current = true;
    if (demoRef.current) setDemo(false);
    svgRef.current?.setPointerCapture(e.pointerId);
    magX.current = clamp(toSvgX(e.clientX), MAG_MIN, MAG_MAX);
    e.preventDefault();
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    magX.current = clamp(toSvgX(e.clientX), MAG_MIN, MAG_MAX);
  };
  const endDrag = () => {
    dragging.current = false;
  };

  const mx = magX.current;
  const fluxNow = fluxFromPosition(1 - Math.abs(mx - COIL_X) / 220);
  const emfNow = emf.current;
  const v = vel.current;
  const status =
    Math.abs(v) < STOP_VEL
      ? t.induction.stopped
      : distVel.current < 0
        ? t.induction.approaching
        : t.induction.receding;

  // Galvanometer geometry
  const GX = 468;
  const GY = 268;
  const nRad = (needleDeg.current * Math.PI) / 180;
  const nTip = { x: GX + 36 * Math.sin(nRad), y: GY - 36 * Math.cos(nRad) };

  // Field lines N -> S (N is the right half of the bar)
  const arcs = [
    `M ${mx + 50} ${COIL_Y - 20} C ${mx + 44} ${COIL_Y - 118} ${mx - 44} ${COIL_Y - 118} ${mx - 50} ${COIL_Y - 20}`,
    `M ${mx + 50} ${COIL_Y + 20} C ${mx + 44} ${COIL_Y + 118} ${mx - 44} ${COIL_Y + 118} ${mx - 50} ${COIL_Y + 20}`,
    `M ${mx + 55} ${COIL_Y - 8} C ${mx + 72} ${COIL_Y - 152} ${mx - 72} ${COIL_Y - 152} ${mx - 55} ${COIL_Y - 8}`,
  ];

  // History strip points
  const nowS = performance.now() / 1000;
  const pts = samples.current
    .map((s) => {
      const px = ((s.t - (nowS - HIST_SEC)) / HIST_SEC) * 560;
      const py = 45 - clamp(s.v / EMF_REF, -1, 1) * 34;
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox="0 0 560 340"
        width="100%"
        style={{ display: 'block', height: 'auto', touchAction: 'none' }}
        role="img"
        aria-label={t.induction.title}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <defs>
          <marker
            id="fldArrow"
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#f59e0b" opacity={0.7} />
          </marker>
        </defs>

        {/* coil axis */}
        <line
          x1={24}
          y1={COIL_Y}
          x2={536}
          y2={COIL_Y}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={2}
          strokeDasharray="4 7"
        />

        {/* field lines (drawn under the magnet) */}
        {arcs.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={2}
            opacity={0.45}
            strokeDasharray="7 9"
            markerEnd="url(#fldArrow)"
          >
            {!reduced && (
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-64"
                dur="1.6s"
                repeatCount="indefinite"
              />
            )}
          </path>
        ))}

        {/* coil: 5 copper loops */}
        {[0, 1, 2, 3, 4].map((i) => (
          <ellipse
            key={i}
            cx={COIL_X + (i - 2) * 17}
            cy={COIL_Y}
            rx={13}
            ry={62}
            fill="none"
            stroke="#d08a4a"
            strokeWidth={5}
          />
        ))}

        {/* leads coil -> galvanometer */}
        <path
          d="M 297 210 C 350 222 395 232 428 244"
          fill="none"
          stroke="#aeb9d1"
          strokeWidth={4}
        />
        <path
          d="M 323 210 C 360 230 398 250 428 292"
          fill="none"
          stroke="#aeb9d1"
          strokeWidth={4}
        />

        {/* draggable bar magnet */}
        <g data-magnet style={{ cursor: 'grab', touchAction: 'none' }}>
          <rect x={mx - 55} y={COIL_Y - MAG_H / 2} width={56} height={MAG_H} rx={6} fill="#3b82f6" />
          <rect x={mx + 1} y={COIL_Y - MAG_H / 2} width={54} height={MAG_H} rx={6} fill="#ef4444" />
          <rect
            x={mx - 55}
            y={COIL_Y - MAG_H / 2}
            width={MAG_W}
            height={MAG_H}
            rx={6}
            fill="none"
            stroke="#0b1526"
            strokeWidth={2}
          />
          <text x={mx - 27} y={COIL_Y + 6} textAnchor="middle" fill="#fff" fontSize={17} fontWeight={800}>
            S
          </text>
          <text x={mx + 28} y={COIL_Y + 6} textAnchor="middle" fill="#fff" fontSize={17} fontWeight={800}>
            N
          </text>
        </g>

        {/* galvanometer */}
        <g>
          <circle cx={GX} cy={GY} r={46} fill="#0a1120" stroke="#93a1bd" strokeWidth={2} />
          {[-60, -30, 0, 30, 60].map((a) => {
            const rad = (a * Math.PI) / 180;
            return (
              <line
                key={a}
                x1={GX + 34 * Math.sin(rad)}
                y1={GY - 34 * Math.cos(rad)}
                x2={GX + 42 * Math.sin(rad)}
                y2={GY - 42 * Math.cos(rad)}
                stroke="#93a1bd"
                strokeWidth={a === 0 ? 2.5 : 1.5}
              />
            );
          })}
          <text x={GX - 47} y={GY - 25} textAnchor="middle" fill="#93a1bd" fontSize={14} fontWeight={700}>
            −
          </text>
          <text x={GX + 47} y={GY - 25} textAnchor="middle" fill="#93a1bd" fontSize={14} fontWeight={700}>
            +
          </text>
          <text x={GX} y={GY - 50} textAnchor="middle" fill="#93a1bd" fontSize={13} fontWeight={700}>
            0
          </text>
          <line
            x1={GX}
            y1={GY}
            x2={nTip.x}
            y2={nTip.y}
            stroke="#fbbf24"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={GX} cy={GY} r={5} fill="#e8eefb" />
        </g>
      </svg>

      <div className="hint" role="status" aria-live="polite" style={{ marginTop: 10 }}>
        <strong>{status}</strong>
      </div>

      {Math.abs(emfNow) > CHANGE_TH && (
        <div
          style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '8px 18px',
            borderRadius: 999,
            background: 'rgba(245,158,11,0.14)',
            border: '1px solid #f59e0b',
            color: '#fbbf24',
            fontWeight: 800,
            letterSpacing: 1.5,
            fontSize: 15,
          }}
        >
          {t.induction.changeLine}
        </div>
      )}

      {/* induced-voltage history strip */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12.5, color: '#93a1bd', marginBottom: 6, fontWeight: 600 }}>
          {t.induction.inducedLabel}
        </div>
        <svg
          viewBox="0 0 560 90"
          width="100%"
          style={{ display: 'block', height: 'auto', background: '#0a1120', borderRadius: 10 }}
          role="img"
          aria-label={t.induction.inducedLabel}
        >
          <line x1={0} y1={45} x2={560} y2={45} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="5 4" />
          <text x={8} y={16} fill="#93a1bd" fontSize={13} fontWeight={700}>+</text>
          <text x={8} y={80} fill="#93a1bd" fontSize={13} fontWeight={700}>−</text>
          <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinejoin="round" />
        </svg>
      </div>

      {/* flux meter */}
      <div className="ctl">
        <label>
          <span>{t.induction.fluxLabel}</span>
          <span className="val">{Math.round(fluxNow * 100)} %</span>
        </label>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
          <div
            style={{
              width: `${fluxNow * 100}%`,
              height: '100%',
              borderRadius: 999,
              background: '#f59e0b',
            }}
          />
        </div>
      </div>

      <div className="timebar">
        <button
          type="button"
          className={`tbtn ${demo ? 'on' : ''}`}
          onClick={() => setDemo((d) => !d)}
          aria-pressed={demo}
          aria-label={`${t.induction.speedLabel}: ${demo ? t.common.pause : t.common.play}`}
        >
          {demo ? `⏸ ${t.common.pause}` : `▶ ${t.common.play}`}
        </button>
      </div>
      <Slider
        label={t.induction.speedLabel}
        value={demoFreq}
        min={0.3}
        max={2}
        step={0.1}
        onChange={setDemoFreq}
        unit="Hz"
        format={(v) => v.toFixed(1)}
      />

      <p className="hint">{t.induction.dragMagnet}</p>
      <p className="hint">{t.induction.tipFaster}</p>
    </div>
  );
}
