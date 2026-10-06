// Saw — the two-person saw analogy.
// Drag the saw back and forth: it never "travels" anywhere, yet it cuts the log.
// Sawdust, a deepening cut notch, and work/energy badges on completion.
import React, { useRef, useState } from 'react';
import { useT } from '../i18n';
import { useRaf } from '../hooks';
import { clamp } from '../physics';

const MAX_X = 90; // drag range, px
const STROKE_FULL = 1400; // cumulative px of saw motion for a full cut
const LOG_CX = 280;
const LOG_TOP = 198;

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export default function Saw() {
  const { t } = useT();
  const [sawX, setSawX] = useState(0);
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  const sawXRef = useRef(0);
  const dragRef = useRef<{ pointerId: number; startClientX: number; startSawX: number } | null>(null);
  const idRef = useRef(0);

  // age + gravity for sawdust particles
  useRaf(true, (dt) => {
    setParticles((ps) =>
      ps.length === 0
        ? ps
        : ps
            .map((p) => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + 320 * dt, life: p.life - dt * 1.3 }))
            .filter((p) => p.life > 0)
            .slice(-20),
    );
  });

  const spawnDust = (nx: number) => {
    const mk = (): Particle => ({
      id: ++idRef.current,
      x: LOG_CX + nx + (Math.random() - 0.5) * 14,
      y: LOG_TOP + Math.random() * 4,
      vx: (Math.random() - 0.5) * 90,
      vy: -40 - Math.random() * 70,
      life: 0.9,
    });
    setParticles((ps) => [...ps, mk(), mk()].slice(-20));
  };

  const moveSaw = (nx: number, dust: boolean) => {
    const cx = clamp(nx, -MAX_X, MAX_X);
    const d = Math.abs(cx - sawXRef.current);
    sawXRef.current = cx;
    setSawX(cx);
    if (d > 0.4) {
      setProgress((p) => Math.min(1, p + d / STROKE_FULL));
      if (dust) spawnDust(cx);
    }
  };

  const onPointerDown = (e: React.PointerEvent<SVGGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { pointerId: e.pointerId, startClientX: e.clientX, startSawX: sawXRef.current };
  };
  const onPointerMove = (e: React.PointerEvent<SVGGElement>) => {
    const dr = dragRef.current;
    if (!dr || dr.pointerId !== e.pointerId) return;
    moveSaw(dr.startSawX + (e.clientX - dr.startClientX), true);
  };
  const endDrag = () => {
    dragRef.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent<SVGGElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveSaw(sawXRef.current - 14, true);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveSaw(sawXRef.current + 14, true);
    }
  };

  const reset = () => {
    sawXRef.current = 0;
    setSawX(0);
    setProgress(0);
    setParticles([]);
  };

  const done = progress >= 1;
  const depth = progress * 54;
  const notchW = 5 + progress * 9;
  const sawCX = LOG_CX + sawX;

  return (
    <div>
      <div role="img" aria-label={t.saw.dragSaw} style={{ marginTop: 6 }}>
        <svg viewBox="0 0 560 320" width="100%" style={{ display: 'block', touchAction: 'none' }}>
          {/* ground */}
          <line x1={10} y1={296} x2={550} y2={296} stroke="rgba(255,255,255,0.15)" strokeWidth={2} />

          {/* sawhorse legs */}
          {[190, 370].map((x) => (
            <g key={x} stroke="#6b4a2f" strokeWidth={10} strokeLinecap="round">
              <line x1={x - 26} y1={294} x2={x + 22} y2={244} />
              <line x1={x + 26} y1={294} x2={x - 22} y2={244} />
            </g>
          ))}

          {/* log */}
          <rect x={130} y={LOG_TOP} width={300} height={54} rx={20} fill="#8b5a2b" />
          <line x1={140} y1={216} x2={420} y2={216} stroke="#6e4420" strokeWidth={3} />
          <line x1={140} y1={234} x2={420} y2={234} stroke="#6e4420" strokeWidth={3} />
          <ellipse cx={430} cy={225} rx={10} ry={27} fill="#a06a35" />
          <ellipse cx={430} cy={225} rx={5} ry={15} fill="none" stroke="#7c4f24" strokeWidth={2} />

          {/* cut notch, deepens with progress */}
          {progress > 0.01 && (
            <polygon
              points={`${LOG_CX - notchW},${LOG_TOP} ${LOG_CX + notchW},${LOG_TOP} ${LOG_CX},${LOG_TOP + depth}`}
              fill="#241407"
            />
          )}

          {/* people (abstract) with arms following the saw handles */}
          {[
            { hx: 56, flip: 1 },
            { hx: 504, flip: -1 },
          ].map((p) => (
            <g key={p.hx}>
              <line
                x1={p.hx}
                y1={292}
                x2={p.hx - 12 * p.flip}
                y2={238}
                stroke="#c9d4ea"
                strokeWidth={9}
                strokeLinecap="round"
              />
              <line
                x1={p.hx}
                y1={292}
                x2={p.hx + 12 * p.flip}
                y2={238}
                stroke="#c9d4ea"
                strokeWidth={9}
                strokeLinecap="round"
              />
              <rect x={p.hx - 13} y={140} width={26} height={104} rx={13} fill="#c9d4ea" />
              <circle cx={p.hx} cy={118} r={16} fill="#e3b98f" />
              <line
                x1={p.hx + 10 * p.flip}
                y1={162}
                x2={sawCX + (p.flip === 1 ? -172 : 172)}
                y2={180}
                stroke="#c9d4ea"
                strokeWidth={8}
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* draggable saw */}
          <g
            transform={`translate(${sawCX} 0)`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="slider"
            aria-label={t.saw.dragSaw}
            aria-valuemin={-MAX_X}
            aria-valuemax={MAX_X}
            aria-valuenow={Math.round(sawX)}
            style={{ touchAction: 'none', cursor: 'grab', outline: 'none' }}
          >
            <polygon points="-170,168 170,168 150,196 -150,196" fill="#9aa5b8" />
            <polyline
              points={Array.from({ length: 35 }, (_, i) => `${-150 + i * (300 / 34)},${196 + (i % 2 === 0 ? 0 : 5)}`).join(' ')}
              fill="none"
              stroke="#5f6b80"
              strokeWidth={2}
            />
            <rect x={-186} y={160} width={20} height={30} rx={7} fill="#5a3a22" />
            <rect x={166} y={160} width={20} height={30} rx={7} fill="#5a3a22" />
          </g>

          {/* sawdust */}
          {particles.map((p) => (
            <circle key={p.id} cx={p.x} cy={p.y} r={2.6} fill="#e0aa5e" opacity={Math.max(0, Math.min(1, p.life))} />
          ))}
        </svg>
      </div>

      <p className="hint">
        🖱️ {t.saw.dragSaw} · {t.common.dragHint}
      </p>

      {/* cut progress */}
      <div className="ctl" aria-hidden="true">
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.round(progress * 100)}%`,
              height: '100%',
              background: '#22c55e',
              transition: 'width 120ms',
            }}
          />
        </div>
      </div>

      {done && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '6px 0 2px' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid #22c55e',
              color: '#4ade80',
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            ✓ {t.saw.work}
          </span>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid #22c55e',
              color: '#4ade80',
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            ⚡ {t.saw.energy}
          </span>
          <button className="tbtn" onClick={reset} aria-label={t.common.tryIt}>
            ↺
          </button>
        </div>
      )}

      {/* saw ↔ electrons correspondence */}
      <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <strong style={{ minWidth: 110, fontSize: 14 }}>{t.saw.sawLabel}</strong>
          <span style={{ fontSize: 20, letterSpacing: 4 }} aria-hidden="true">
            ↔ ↔ ↔
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <strong style={{ minWidth: 110, fontSize: 14 }}>{t.saw.electronsLabel}</strong>
          <div role="img" aria-label={t.saw.electronsLabel} style={{ flex: 1 }}>
            <svg viewBox="0 0 300 44" width="100%" style={{ display: 'block', maxWidth: 340 }}>
              <rect x={8} y={16} width={284} height={12} rx={6} fill="#16223a" stroke="rgba(255,255,255,0.14)" />
              {Array.from({ length: 6 }, (_, i) => (
                <circle key={i} cx={36 + i * 48 + sawX * 0.3} cy={22} r={6} fill="#3b82f6" stroke="#dbe7ff" strokeWidth={1} />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
