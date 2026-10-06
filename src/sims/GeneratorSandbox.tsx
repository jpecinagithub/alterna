// GeneratorSandbox — auto-running generator lab.
// Sliders: spin speed (→ frequency), field strength (→ amplitude),
// coil turns (→ amplitude). ε(t) = N·B·A·ω·sin(ωt), educational-grade model.
import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';
import { Slider, TimeControls } from '../components/ui';
import { useReducedMotion, useSimClock } from '../hooks';
import WaveChart from '../components/WaveChart';
import { clamp, fmt } from '../physics';

const CX = 280;
const CY = 105;

type ChangedKey = 'speed' | 'field' | 'turns';

export default function GeneratorSandbox() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [speed, setSpeed] = useState(1); // rev/s  (0.2–3)
  const [field, setField] = useState(1); // relative (0.2–1.5)
  const [turns, setTurns] = useState(3); // coil turns (1–8)
  const [playing, setPlaying] = useState(!reduced); // default paused when reduced motion
  const [timeSpeed, setTimeSpeed] = useState(1);
  const { time } = useSimClock({ playing, speed: timeSpeed });
  const [lastKey, setLastKey] = useState<ChangedKey | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const markChanged = (key: ChangedKey) => {
    setLastKey(key);
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setLastKey(null), 4000);
  };

  const theta = 2 * Math.PI * speed * time;
  const deg = (theta * 180) / Math.PI;
  const amp = clamp((speed * field * turns) / 8, 0.1, 3); // display units, V
  const msg =
    lastKey === 'speed'
      ? t.sandbox.msgSpeed
      : lastKey === 'field'
        ? t.sandbox.msgField
        : lastKey === 'turns'
          ? t.sandbox.msgTurns
          : null;

  const nTurns = Math.round(turns);
  const nField = Math.max(2, Math.round(2 + field * 2));
  const fieldOpacity = clamp(0.2 + field * 0.35, 0.2, 0.8);

  return (
    <div>
      <Slider
        label={t.sandbox.speed}
        value={speed}
        min={0.2}
        max={3}
        step={0.1}
        unit="rev/s"
        format={(v) => fmt(v, 1)}
        onChange={(v) => {
          setSpeed(v);
          markChanged('speed');
        }}
      />
      <Slider
        label={t.sandbox.field}
        value={field}
        min={0.2}
        max={1.5}
        step={0.05}
        format={(v) => fmt(v, 2)}
        onChange={(v) => {
          setField(v);
          markChanged('field');
        }}
      />
      <Slider
        label={t.sandbox.turns}
        value={turns}
        min={1}
        max={8}
        step={1}
        format={(v) => fmt(v, 0)}
        onChange={(v) => {
          setTurns(v);
          markChanged('turns');
        }}
      />

      <TimeControls
        playing={playing}
        onToggle={() => setPlaying((p) => !p)}
        speed={timeSpeed}
        onSpeed={setTimeSpeed}
        speeds={[0.25, 1, 4]}
      />

      <svg
        viewBox="0 0 560 260"
        width="100%"
        role="img"
        aria-label={t.sandbox.title}
        style={{ display: 'block', marginTop: 14 }}
      >
        <defs>
          <marker
            id="sbFld"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 2 L 10 5 L 0 8" fill="none" stroke="#f59e0b" strokeWidth={1.6} opacity={0.6} />
          </marker>
        </defs>

        {/* field lines: count and opacity scale with field strength */}
        {Array.from({ length: nField }, (_, i) => {
          const x = nField === 1 ? CX : 205 + (i * 150) / (nField - 1);
          return (
            <line
              key={i}
              x1={x}
              y1={196}
              x2={x}
              y2={26}
              stroke="#f59e0b"
              strokeWidth={2}
              opacity={fieldOpacity}
              markerEnd="url(#sbFld)"
            />
          );
        })}

        {/* coil: one copper loop arc per turn, drawn around the rotor */}
        {Array.from({ length: nTurns }, (_, i) => (
          <ellipse
            key={i}
            cx={CX}
            cy={CY}
            rx={54 + i * 8}
            ry={66}
            fill="none"
            stroke="#c98a4b"
            strokeWidth={5}
            opacity={0.9}
          />
        ))}

        {/* rotor: N/S halves spinning at `speed` rev/s */}
        <g transform={`translate(${CX} ${CY}) rotate(${deg.toFixed(1)})`}>
          <path d="M -40 0 A 40 40 0 0 1 40 0 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth={1.5} />
          <path d="M -40 0 A 40 40 0 0 0 40 0 Z" fill="#3b82f6" stroke="#1e3a8a" strokeWidth={1.5} />
          <text x={0} y={-22} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff">N</text>
          <text x={0} y={28} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff">S</text>
        </g>
        <circle cx={CX} cy={CY} r={5} fill="#0a1120" stroke="#e8eefb" strokeWidth={2} />
      </svg>

      <p className="hint">
        <strong>{t.sandbox.freqRead}:</strong> {fmt(speed, 1)} Hz · <strong>{t.sandbox.ampRead}:</strong>{' '}
        {fmt(amp, 1)} V
      </p>
      {msg && (
        <p className="hint">
          <strong>{msg}</strong>
        </p>
      )}

      <WaveChart
        freq={speed}
        amp={amp}
        time={time}
        unit="V"
        label={t.common.voltage}
        ariaLabel={t.common.voltage}
      />
    </div>
  );
}
