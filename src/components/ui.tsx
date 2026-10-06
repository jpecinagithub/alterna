// Shared UI primitives used by every experiment. Dark-lab styled controls.
import React from 'react';
import { useT } from '../i18n';

/* ---------------- Slider ---------------- */
export function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
  format?: (v: number) => string;
  ariaLabel?: string;
}) {
  const { label, value, min, max, step, onChange, unit, format, ariaLabel } = props;
  return (
    <div className="ctl">
      <label>
        <span>{label}</span>
        <span className="val">
          {format ? format(value) : value}
          {unit ? ` ${unit}` : ''}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel || label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

/* ---------------- Segmented control ---------------- */
export function Seg<T extends string>(props: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="seg" role="group" aria-label={props.ariaLabel}>
      {props.options.map((o) => (
        <button
          key={o.value}
          className={o.value === props.value ? 'on' : ''}
          onClick={() => props.onChange(o.value)}
          aria-pressed={o.value === props.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Time controls: pause/play + speed ---------------- */
export function TimeControls(props: {
  playing: boolean;
  onToggle: () => void;
  speed: number;
  onSpeed: (s: number) => void;
  speeds?: number[];
  extra?: React.ReactNode;
}) {
  const { t } = useT();
  const speeds = props.speeds ?? [0.1, 1, 10];
  return (
    <div className="timebar" role="group" aria-label="time controls">
      <button className="tbtn" onClick={props.onToggle} aria-label={props.playing ? t.common.pause : t.common.play}>
        {props.playing ? `⏸ ${t.common.pause}` : `▶ ${t.common.play}`}
      </button>
      {speeds.map((s) => (
        <button
          key={s}
          className={`tbtn ${props.speed === s ? 'on' : ''}`}
          onClick={() => props.onSpeed(s)}
          aria-pressed={props.speed === s}
        >
          ×{s}
        </button>
      ))}
      {props.extra}
    </div>
  );
}

/* ---------------- "What am I looking at?" collapsible ---------------- */
export function WhatSeeing({ text }: { text: string }) {
  const { t } = useT();
  return (
    <div className="what">
      <details>
        <summary>🔍 {t.common.whatSeeing}</summary>
        <div className="what-body">{text}</div>
      </details>
    </div>
  );
}

/* ---------------- Prediction prompt ---------------- */
export function Prediction({ text }: { text?: string }) {
  const { t } = useT();
  if (!text) return null;
  return (
    <div className="card predict">
      <h4>🔮 {t.common.predict}</h4>
      <p>{text}</p>
    </div>
  );
}

/* ---------------- Discovery insight ---------------- */
export function Insight({ text }: { text?: string }) {
  const { t } = useT();
  if (!text) return null;
  return (
    <div className="card insight">
      <h4>💡 {t.common.discover}</h4>
      <p>{text}</p>
    </div>
  );
}

/* ---------------- Physics note (shown in "see the physics" mode) ---------------- */
export function PhysicsNote({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  return (
    <div className="physics-note">
      <h4>⚛ {t.common.physicsTitle}</h4>
      <div>{children}</div>
    </div>
  );
}

/* ---------------- Intuition / physics mode switch ---------------- */
export function ModeSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { t } = useT();
  return (
    <div className="mode-switch" role="group" aria-label="mode">
      <button className={!value ? 'on' : ''} onClick={() => onChange(false)} aria-pressed={!value}>
        {t.common.intuition}
      </button>
      <button className={value ? 'on' : ''} onClick={() => onChange(true)} aria-pressed={value}>
        ⚛ {t.common.seePhysics}
      </button>
    </div>
  );
}
