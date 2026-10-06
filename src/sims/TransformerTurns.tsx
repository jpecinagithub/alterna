// Interactive transformer: change the number of turns on each coil and watch
// the output voltage rise or fall. Ideal-transformer model: Vs/Vp = Ns/Np.
import { useState } from 'react';
import { useT } from '../i18n';
import { Seg, Slider, TimeControls } from '../components/ui';
import { useReducedMotion, useSimClock } from '../hooks';
import { clamp } from '../physics';
import WaveChart from '../components/WaveChart';

const COPPER = '#d08a4e';
const AMBER = '#fbbf24';
const LAB_BG = '#0e1626';
const DIM = '#93a1bd';
const VP = 230;

function loopYs(n: number): number[] {
  if (n <= 1) return [150];
  return Array.from({ length: n }, (_, i) => 95 + (i * 110) / (n - 1));
}

export default function TransformerTurns() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(!reduced);
  const [speed, setSpeed] = useState(1);
  const [np, setNp] = useState(100);
  const [ns, setNs] = useState(100);
  const [preset, setPreset] = useState('100/100');
  const { time } = useSimClock({ playing, speed });

  const applyPreset = (p: string) => {
    const [a, b] = p.split('/').map(Number);
    setNp(a);
    setNs(b);
    setPreset(p);
  };

  const n1 = clamp(Math.round(np / 50), 1, 6);
  const n2 = clamp(Math.round(ns / 50), 1, 6);
  const vs = Math.round((VP * ns) / np);
  const glowOpacity = 0.35 + 0.45 * Math.abs(Math.sin(2 * Math.PI * 2 * time));

  return (
    <div className="sim-panel">
      <Seg<string>
        ariaLabel={t.turns.presets}
        value={preset}
        onChange={applyPreset}
        options={[
          { value: '100/100', label: '100/100' },
          { value: '100/200', label: '100/200' },
          { value: '200/100', label: '200/100' },
        ]}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 4 }}>
        <Slider label={t.turns.primaryTurns} value={np} min={50} max={300} step={50} unit={t.turns.turnsUnit}
          onChange={(v) => { setNp(v); setPreset('custom'); }} />
        <Slider label={t.turns.secondaryTurns} value={ns} min={50} max={300} step={50} unit={t.turns.turnsUnit}
          onChange={(v) => { setNs(v); setPreset('custom'); }} />
      </div>
      <TimeControls playing={playing} onToggle={() => setPlaying((p) => !p)} speed={speed} onSpeed={setSpeed} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '14px 0 4px', fontSize: 22, fontWeight: 800, flexWrap: 'wrap' }}>
        <span>{VP} V</span>
        <span aria-hidden="true" style={{ color: DIM }}>→</span>
        <svg width="52" height="34" viewBox="0 0 52 34" aria-hidden="true">
          <line x1={24} y1={4} x2={24} y2={30} stroke="#94a3b8" strokeWidth={3} />
          <line x1={28} y1={4} x2={28} y2={30} stroke="#94a3b8" strokeWidth={3} />
          <path d="M 6 8 a 5 6 0 0 1 10 0 M 6 17 a 5 6 0 0 1 10 0 M 6 26 a 5 6 0 0 1 10 0" fill="none" stroke={COPPER} strokeWidth={2.5} />
          <path d="M 36 8 a 5 6 0 0 1 10 0 M 36 17 a 5 6 0 0 1 10 0 M 36 26 a 5 6 0 0 1 10 0" fill="none" stroke={COPPER} strokeWidth={2.5} />
        </svg>
        <span aria-hidden="true" style={{ color: DIM }}>→</span>
        <span>{vs} V</span>
      </div>
      <div className="hint" style={{ textAlign: 'center', marginTop: 0 }}>
        Ns/Np = {ns}/{np}
      </div>

      <svg viewBox="0 0 560 300" width="100%" role="img" aria-label={t.turns.title} style={{ marginTop: 8 }}>
        <defs>
          <radialGradient id="turns-bulb-glow">
            <stop offset="0%" stopColor="#ffd166" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#ffd166" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* coils first; core limb covers their middles */}
        {loopYs(n1).map((y) => (
          <ellipse key={`p${y}`} cx={210} cy={y} rx={34} ry={13} fill="none" stroke={COPPER} strokeWidth={5} />
        ))}
        {loopYs(n2).map((y) => (
          <ellipse key={`s${y}`} cx={350} cy={y} rx={34} ry={13} fill="none" stroke={COPPER} strokeWidth={5} />
        ))}
        <rect x={210} y={50} width={140} height={200} rx={18} fill={LAB_BG} stroke="#94a3b8" strokeWidth={24} />

        {/* varying field (always AC here) */}
        <rect
          x={242} y={82} width={76} height={136} rx={14}
          fill="none" stroke={AMBER} strokeWidth={2.5}
          strokeDasharray="10 8" strokeDashoffset={-time * 60}
          opacity={0.5 + 0.4 * Math.sin(2 * Math.PI * 2 * time)}
        />

        {/* input: 230 V sine source */}
        <line x1={30} y1={140} x2={176} y2={140} stroke="#5b6b8c" strokeWidth={3} />
        <circle cx={88} cy={140} r={19} fill={LAB_BG} stroke="#e8eefb" strokeWidth={2.5} />
        <text x={88} y={147} textAnchor="middle" fontSize={18} fill="#e8eefb">∿</text>
        <text x={140} y={128} textAnchor="middle" fontSize={15} fill="#e8eefb" fontWeight={700} aria-hidden="true">↔</text>
        <text x={88} y={100} textAnchor="middle" fontSize={12.5} fill={DIM}>{t.turns.inVoltage}: {VP} V</text>

        {/* output bulb */}
        <line x1={384} y1={140} x2={530} y2={140} stroke="#5b6b8c" strokeWidth={3} />
        <circle cx={462} cy={140} r={28} fill="url(#turns-bulb-glow)" opacity={glowOpacity} />
        <circle cx={462} cy={140} r={17} fill="#ffd166" stroke="#94a3b8" strokeWidth={2.5} />

        {/* turn-count labels */}
        <text x={110} y={70} textAnchor="middle" fontSize={12.5} fill={DIM}>
          {t.turns.primaryTurns}: {np} {t.turns.turnsUnit}
        </text>
        <text x={450} y={70} textAnchor="middle" fontSize={12.5} fill={DIM}>
          {t.turns.secondaryTurns}: {ns} {t.turns.turnsUnit}
        </text>
      </svg>

      <WaveChart freq={2} amp={ns / np} time={time} height={110} unit="V" label={`${t.turns.outVoltage}: ${vs} V`} color="#3b82f6" />
      <div className="hint">{t.turns.physics}</div>
    </div>
  );
}
