// The transformer: two coils sharing an iron core. Steady DC makes a static
// field (nothing induced except a brief pulse when switching); AC makes a
// continuously varying field (continuous induced voltage in the secondary).
import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';
import { Seg, TimeControls } from '../components/ui';
import { useReducedMotion, useSimClock } from '../hooks';
import WaveChart from '../components/WaveChart';

type Mode = 'dc' | 'ac';

const COPPER = '#d08a4e';
const AMBER = '#fbbf24';
const LAB_BG = '#0e1626';
const DIM = '#93a1bd';
const LOOP_YS = [100, 140, 180, 220];

export default function Transformer() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(!reduced);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState<Mode>('ac');
  const [pulse, setPulse] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const { time } = useSimClock({ playing, speed });

  const select = (m: Mode) => {
    setMode(m);
    window.clearTimeout(timer.current);
    setPulse(m === 'dc');
    if (m === 'dc') {
      // brief induced pulse when the DC field appears, then nothing
      timer.current = window.setTimeout(() => setPulse(false), 600);
    }
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const ac = mode === 'ac';
  const fieldOpacity = ac ? 0.5 + 0.4 * Math.sin(2 * Math.PI * 2 * time) : 0.22;
  const dashOffset = ac ? -time * 60 : 0;
  const bulbLit = ac || pulse;
  const glowOpacity = ac ? 0.35 + 0.45 * Math.abs(Math.sin(2 * Math.PI * 2 * time)) : 1;

  return (
    <div className="sim-panel">
      <Seg<Mode>
        ariaLabel={t.transformer.title}
        value={mode}
        onChange={select}
        options={[
          { value: 'dc', label: t.transformer.ccLabel },
          { value: 'ac', label: t.transformer.caLabel },
        ]}
      />
      <TimeControls playing={playing} onToggle={() => setPlaying((p) => !p)} speed={speed} onSpeed={setSpeed} />
      <svg viewBox="0 0 560 340" width="100%" role="img" aria-label={t.transformer.title} style={{ marginTop: 12 }}>
        <defs>
          <radialGradient id="trafo-bulb-glow">
            <stop offset="0%" stopColor="#ffd166" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#ffd166" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* coils (drawn first so the core limb covers their middles) */}
        {LOOP_YS.map((y) => (
          <ellipse key={`p${y}`} cx={205} cy={y} rx={36} ry={15} fill="none" stroke={COPPER} strokeWidth={5} />
        ))}
        {LOOP_YS.map((y) => (
          <ellipse key={`s${y}`} cx={355} cy={y} rx={36} ry={15} fill="none" stroke={COPPER} strokeWidth={5} />
        ))}

        {/* iron core ring */}
        <rect x={205} y={60} width={150} height={220} rx={20} fill={LAB_BG} stroke="#94a3b8" strokeWidth={26} />

        {/* magnetic field lines through the core */}
        <rect
          x={240} y={95} width={80} height={150} rx={14}
          fill="none" stroke={AMBER} strokeWidth={2.5}
          strokeDasharray="10 8" strokeDashoffset={dashOffset} opacity={fieldOpacity}
        />

        {/* input wire + source */}
        <line x1={30} y1={150} x2={169} y2={150} stroke="#5b6b8c" strokeWidth={3} />
        {ac ? (
          <g>
            <circle cx={85} cy={150} r={21} fill={LAB_BG} stroke="#e8eefb" strokeWidth={2.5} />
            <text x={85} y={157} textAnchor="middle" fontSize={18} fill="#e8eefb">∿</text>
            <text x={130} y={138} textAnchor="middle" fontSize={15} fill="#e8eefb" fontWeight={700} aria-hidden="true">↔</text>
          </g>
        ) : (
          <g>
            <rect x={66} y={136} width={38} height={28} rx={6} fill={LAB_BG} />
            <line x1={78} y1={139} x2={78} y2={161} stroke="#e8eefb" strokeWidth={3} />
            <line x1={92} y1={144} x2={92} y2={156} stroke="#e8eefb" strokeWidth={7} />
            <text x={78} y={132} textAnchor="middle" fontSize={13} fill="#e8eefb" fontWeight={700}>+</text>
            <text x={92} y={132} textAnchor="middle" fontSize={13} fill="#e8eefb" fontWeight={700}>−</text>
            <text x={130} y={140} textAnchor="middle" fontSize={15} fill="#e8eefb" fontWeight={700} aria-hidden="true">→</text>
          </g>
        )}

        {/* output wire + bulb */}
        <line x1={391} y1={150} x2={530} y2={150} stroke="#5b6b8c" strokeWidth={3} />
        {bulbLit && <circle cx={470} cy={150} r={30} fill="url(#trafo-bulb-glow)" opacity={glowOpacity} />}
        <circle cx={470} cy={150} r={19} fill={bulbLit ? '#ffd166' : '#1a2438'} stroke="#94a3b8" strokeWidth={2.5} />
        {ac && (
          <text x={505} y={140} textAnchor="middle" fontSize={15} fill="#e8eefb" fontWeight={700} aria-hidden="true">↔</text>
        )}

        {/* part labels */}
        <text x={105} y={80} textAnchor="middle" fontSize={12.5} fill={DIM}>{t.transformer.primary}</text>
        <text x={455} y={80} textAnchor="middle" fontSize={12.5} fill={DIM}>{t.transformer.secondary}</text>
        <text x={280} y={308} textAnchor="middle" fontSize={12.5} fill={DIM}>{t.transformer.core}</text>
        <text x={280} y={326} textAnchor="middle" fontSize={13} fontWeight={700} fill={ac ? AMBER : DIM}>
          {ac ? t.transformer.fieldVarying : t.transformer.fieldStatic}
        </text>
      </svg>

      {ac && (
        <>
          <WaveChart freq={2} amp={1} time={time} height={90} unit="V" label={t.transformer.secondary} color="#3b82f6" />
          <div className="hint">{t.transformer.continuousNote}</div>
        </>
      )}
      {!ac && pulse && <div className="hint">{t.transformer.pulseNote}</div>}
    </div>
  );
}
