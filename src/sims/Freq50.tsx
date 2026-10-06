// Freq50 — "What does 50 Hz really mean?"
// Big live waveform + electron strip + slow-motion x100 view of one 50 Hz cycle.
import { useState } from 'react';
import { useT } from '../i18n';
import { Slider, TimeControls } from '../components/ui';
import { useSimClock, useReducedMotion } from '../hooks';
import WaveChart from '../components/WaveChart';

const PRESETS = [0.5, 1, 5, 10, 25, 50];
const DOTS = 16;
const AMP = 26; // electron oscillation amplitude, px (visual)

function fmtF(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

export default function Freq50() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [freq, setFreq] = useState(0.5);
  const [slowmo, setSlowmo] = useState(false);
  const [playing, setPlaying] = useState(!reduced);
  const [speed, setSpeed] = useState(1);

  // Slow motion only makes sense at 50 Hz: force it while active, and run x0.01.
  const effFreq = slowmo ? 50 : freq;
  const effSpeed = speed * (slowmo ? 0.01 : 1);
  const { time } = useSimClock({ playing, speed: effSpeed });

  const phase = 2 * Math.PI * effFreq * time;
  const p = Math.sin(phase);

  const dir =
    p > 0.25 ? { text: t.freq.dirPos, color: '#3b82f6' }
    : p < -0.25 ? { text: t.freq.dirNeg, color: '#f97316' }
    : { text: t.freq.dirZero, color: '#93a1bd' };

  const pickPreset = (f: number) => {
    setFreq(f);
    if (f !== 50) setSlowmo(false);
  };

  const onSlider = (v: number) => {
    setSlowmo(false);
    setFreq(v);
  };

  return (
    <div>
      <WaveChart
        freq={effFreq}
        amp={1}
        time={time}
        height={170}
        unit="V"
        label={t.common.voltage}
        ariaLabel={`${t.freq.title} — ${fmtF(effFreq)} Hz`}
      />

      {/* live direction readout: arrows + text, never color-only */}
      <div
        role="status"
        aria-live="off"
        style={{ fontSize: 22, fontWeight: 800, color: dir.color, margin: '12px 0 4px', minHeight: 32 }}
      >
        {dir.text}
      </div>
      <div className="hint" style={{ marginTop: 0 }}>
        <strong>{fmtF(effFreq)} Hz</strong> · {effFreq} {t.freq.cyclesSec}
      </div>

      {/* electron strip: dots oscillate in phase with the wave */}
      <div role="img" aria-label={`${t.freq.title} — ${t.electrons.modeCA}`} style={{ marginTop: 12 }}>
        <svg viewBox="0 0 560 110" width="100%" style={{ display: 'block' }}>
          <rect x={14} y={47} width={532} height={16} rx={8} fill="#16223a" stroke="rgba(255,255,255,0.14)" />
          {Array.from({ length: DOTS }, (_, i) => {
            const cx = 40 + (i * 480) / (DOTS - 1);
            return (
              <circle
                key={i}
                cx={cx + AMP * Math.sin(phase)}
                cy={55}
                r={7}
                fill="#3b82f6"
                stroke="#dbe7ff"
                strokeWidth={1}
              />
            );
          })}
        </svg>
      </div>

      <Slider
        label={t.freq.freqLabel}
        value={slowmo ? 50 : freq}
        min={0.5}
        max={50}
        step={0.5}
        onChange={onSlider}
        format={(v) => `${fmtF(v)} Hz`}
      />

      <div className="timebar" role="group" aria-label={t.freq.freqLabel}>
        {PRESETS.map((f) => (
          <button
            key={f}
            className={`tbtn ${!slowmo && freq === f ? 'on' : ''}`}
            onClick={() => pickPreset(f)}
            aria-pressed={!slowmo && freq === f}
          >
            {fmtF(f)} Hz
          </button>
        ))}
        <button
          className={`tbtn ${slowmo ? 'on' : ''}`}
          onClick={() => setSlowmo((s) => !s)}
          aria-pressed={slowmo}
        >
          🐢 {t.freq.slowmo}
        </button>
      </div>

      {slowmo && (
        <div
          className="hint"
          style={{
            display: 'inline-block',
            marginTop: 10,
            padding: '6px 12px',
            borderRadius: 999,
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.5)',
          }}
        >
          <strong style={{ color: '#7fb0ff' }}>🔍 {t.freq.slowmoOn}</strong>
        </div>
      )}

      <TimeControls
        playing={playing}
        onToggle={() => setPlaying((pl) => !pl)}
        speed={speed}
        onSpeed={setSpeed}
        speeds={[0.1, 1]}
      />
    </div>
  );
}
