// Experiment page shell: kicker, title, lede, sim panel + explanation column,
// mode switch, mark-done, prev/next navigation.
import React from 'react';
import { useT } from '../i18n';
import { ModeSwitch, Prediction, Insight, WhatSeeing, PhysicsNote } from './ui';

interface Props {
  id: string;
  num: string;
  title: string;
  lede: string;
  sim: React.ReactNode;
  predict?: string;
  what?: string;
  insight?: string;
  physics?: string;
  physicsMode: boolean;
  onPhysicsMode: (v: boolean) => void;
  completed: boolean;
  onDone: () => void;
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
}

export default function ExperimentFrame(p: Props) {
  const { t } = useT();
  return (
    <div className="exp">
      <div className="wrap">
        <div className="exp-top">
          <span className="exp-kicker">
            {t.common.journey} · {p.num}
          </span>
          <span style={{ marginLeft: 'auto' }}>
            <ModeSwitch value={p.physicsMode} onChange={p.onPhysicsMode} />
          </span>
        </div>
        <h2>{p.title}</h2>
        <p className="lede">{p.lede}</p>

        <div className="exp-grid">
          <div className="sim-panel">{p.sim}</div>
          <div className="explain-col">
            <Prediction text={p.predict} />
            {p.what && <WhatSeeing text={p.what} />}
            <Insight text={p.insight} />
            {p.physicsMode && p.physics && (
              <PhysicsNote>
                <p>{p.physics}</p>
              </PhysicsNote>
            )}
            <button
              className={`btn ${p.completed ? 'btn-ghost' : 'btn-primary'}`}
              onClick={p.onDone}
              disabled={p.completed}
              style={{ alignSelf: 'flex-start' }}
            >
              {p.completed ? t.common.done : t.common.markDone}
            </button>
          </div>
        </div>

        <div className="exp-nav">
          <span>{p.prev && <a className="btn btn-ghost" href={p.prev.href}>{t.common.prev}</a>}</span>
          <span>{p.next && <a className="btn btn-primary" href={p.next.href}>{p.next.label}</a>}</span>
        </div>
      </div>
    </div>
  );
}
