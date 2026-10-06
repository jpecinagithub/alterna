import React, { useEffect, useState } from 'react';
import { LangProvider, useT, type Lang } from './i18n';
import { useStore } from './store';
import ExperimentFrame from './components/ExperimentFrame';
import DcBattery from './sims/DcBattery';
import MagnetCoil from './sims/MagnetCoil';
import SpinGenerator from './sims/SpinGenerator';
import GeneratorSandbox from './sims/GeneratorSandbox';
import Freq50 from './sims/Freq50';
import Electrons from './sims/Electrons';
import Saw from './sims/Saw';
import CcCaCompare from './sims/CcCaCompare';
import Transformer from './sims/Transformer';
import TransformerTurns from './sims/TransformerTurns';
import Transport from './sims/Transport';
import Tesla from './sims/Tesla';
import RotatingField from './sims/RotatingField';
import MindMap from './sims/MindMap';
import Quiz from './sims/Quiz';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './theme.css';

const CHAPTERS = [
  { id: 'dc', Sim: DcBattery },
  { id: 'induction', Sim: MagnetCoil },
  { id: 'spin', Sim: SpinGenerator },
  { id: 'sandbox', Sim: GeneratorSandbox },
  { id: 'freq', Sim: Freq50 },
  { id: 'electrons', Sim: Electrons },
  { id: 'saw', Sim: Saw },
  { id: 'compare', Sim: CcCaCompare },
  { id: 'transformer', Sim: Transformer },
  { id: 'turns', Sim: TransformerTurns },
  { id: 'transport', Sim: Transport },
  { id: 'tesla', Sim: Tesla },
  { id: 'rotfield', Sim: RotatingField },
  { id: 'map', Sim: MindMap },
  { id: 'quiz', Sim: Quiz },
] as const;

type ChapterId = (typeof CHAPTERS)[number]['id'];

function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash || '#/');
  useEffect(() => {
    const fn = () => {
      setHash(window.location.hash || '#/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  return hash;
}

function Header({ lang, setLang, route }: { lang: Lang; setLang: (l: Lang) => void; route: string }) {
  const { t } = useT();
  const onJourney = route === '#/' || route.startsWith('#/cap');
  return (
    <header className="site-header">
      <div className="wrap">
        <a className="brand" href="#/" aria-label="ALTERNA home">
          <span className="brand-mark">∿</span>
          <span>
            <span className="brand-name">ALTERNA</span>
            <br />
            <span className="brand-sub">AC · interactive lab</span>
          </span>
        </a>
        <nav className="nav" aria-label="main">
          <a href="#/" className={onJourney ? 'active' : ''}>{t.common.journey}</a>
          <a href="#/lab" className={route === '#/lab' ? 'active' : ''}>{t.common.lab}</a>
        </nav>
        <div className="lang-toggle" role="group" aria-label="language">
          <button className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')} aria-pressed={lang === 'es'}>ES</button>
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
        </div>
      </div>
    </header>
  );
}

function HeroWave() {
  // Decorative-but-honest: rotation arrow feeding a sine wave.
  return (
    <svg viewBox="0 0 560 120" width="100%" style={{ maxWidth: 560, margin: '28px auto 0', display: 'block' }} aria-hidden="true">
      <defs>
        <marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke="#1d4ed8" strokeWidth={1.6} />
        </marker>
      </defs>
      <g transform="translate(70,60)">
        <circle r={34} fill="none" stroke="#1d4ed8" strokeWidth={3} strokeDasharray="6 6">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle r={5} fill="#1d4ed8">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite" />
        </circle>
      </g>
      <path d="M150,60 L190,60" stroke="#8b93a3" strokeWidth={2} markerEnd="url(#ah)" />
      <path
        d="M190,60 C 220,60 220,10 250,10 S 280,60 310,60 S 340,110 370,110 S 400,60 430,60 S 460,10 490,10"
        fill="none" stroke="#7c3aed" strokeWidth={3.5} strokeLinecap="round"
      />
      <text x="52" y="108" fill="#8b93a3" fontSize="14">↻</text>
      <text x="330" y="108" fill="#8b93a3" fontSize="14">∿</text>
    </svg>
  );
}

function Landing({ completed }: { completed: string[] }) {
  const { t } = useT();
  return (
    <main>
      <div className="wrap">
        <section className="hero">
          <h1>
            {t.landing.titleA} <span className="hl">{t.landing.titleB}</span> {t.landing.titleC}
          </h1>
          <p className="lede">{t.landing.lede}</p>
          <div className="cta-row">
            <a className="btn btn-primary" href="#/cap/dc">{t.landing.cta}</a>
            <a className="btn btn-ghost" href="#/lab">{t.landing.ctaLab}</a>
          </div>
          <HeroWave />
          <div className="hero-q">
            <strong>?</strong> {t.landing.question}
            <br />
            <span style={{ fontSize: 14 }}>{t.landing.questionLead}</span>
          </div>
        </section>

        <section aria-label={t.landing.journeyTitle}>
          <h2 style={{ fontSize: 22, margin: '8px 0 4px' }}>{t.landing.journeyTitle}</h2>
          <p style={{ color: 'var(--ink-soft)', margin: '0 0 16px' }}>{t.landing.journeySub}</p>
          <div className="chapter-grid">
            {t.landing.steps.map((s) => (
              <a key={s.id} className="chapter-card" href={`#/cap/${s.id}`}>
                {completed.includes(s.id) && <span className="done" aria-label="done">✓</span>}
                <span className="num">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Lab({ completed }: { completed: string[] }) {
  const { t } = useT();
  const labIds = ['induction', 'spin', 'freq', 'electrons', 'transformer', 'transport', 'rotfield'];
  return (
    <main className="wrap" style={{ padding: '28px 0 60px' }}>
      <h2 style={{ fontSize: 28, margin: '0 0 6px' }}>🔬 {t.landing.labTitle}</h2>
      <p style={{ color: 'var(--ink-soft)', margin: '0 0 20px' }}>{t.landing.labSub}</p>
      <div className="chapter-grid">
        {t.landing.steps.filter((s) => labIds.includes(s.id)).map((s) => (
          <a key={s.id} className="chapter-card" href={`#/cap/${s.id}`}>
            {completed.includes(s.id) && <span className="done">✓</span>}
            <span className="num">{s.n}</span>
            <h3>{s.t}</h3>
            <p>{s.d}</p>
          </a>
        ))}
      </div>
    </main>
  );
}

function ChapterPage({ id, store, patch, markDone }: {
  id: ChapterId;
  store: ReturnType<typeof useStore>['store'];
  patch: ReturnType<typeof useStore>['patch'];
  markDone: (id: string) => void;
}) {
  const { t } = useT();
  const idx = CHAPTERS.findIndex((c) => c.id === id);
  const ch = CHAPTERS[idx];
  if (!ch) return <Landing completed={store.completed} />;
  const { Sim } = ch;
  const d = (t as any)[id];
  const step = t.landing.steps[idx];
  const prev = idx > 0 ? CHAPTERS[idx - 1] : undefined;
  const next = idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : undefined;

  useEffect(() => {
    patch({ lastChapter: id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <main>
      <ExperimentFrame
        id={id}
        num={step.n}
        title={d.title}
        lede={d.lede}
        sim={<Sim />}
        predict={d.predict}
        what={d.what}
        insight={d.insight}
        physics={d.physics}
        physicsMode={store.physicsMode}
        onPhysicsMode={(v) => patch({ physicsMode: v })}
        completed={store.completed.includes(id)}
        onDone={() => markDone(id)}
        prev={prev ? { href: `#/cap/${prev.id}`, label: t.common.prev } : undefined}
        next={next ? { href: `#/cap/${next.id}`, label: t.common.next } : undefined}
      />
    </main>
  );
}

function Footer() {
  const { t } = useT();
  return (
    <footer className="footer">
      <div className="wrap">
        <span>{t.footer.tagline}</span>
        <span>
          {t.footer.created} · <a href="mailto:jpecina@gmail.com">jpecina@gmail.com</a>
        </span>
      </div>
    </footer>
  );
}

function Shell() {
  const { store, patch, markDone } = useStore();
  const route = useHashRoute();
  const setLang = (l: Lang) => patch({ lang: l });

  let body: React.ReactNode;
  if (route === '#/lab') body = <Lab completed={store.completed} />;
  else if (route.startsWith('#/cap/')) {
    const id = route.slice(6) as ChapterId;
    body = <ChapterPage id={id} store={store} patch={patch} markDone={markDone} />;
  } else body = <Landing completed={store.completed} />;

  return (
    <LangProvider lang={store.lang} setLang={setLang}>
      <Header lang={store.lang} setLang={setLang} route={route} />
      {body}
      <Footer />
      <Analytics />
      <SpeedInsights />
    </LangProvider>
  );
}

export default function App() {
  return <Shell />;
}
