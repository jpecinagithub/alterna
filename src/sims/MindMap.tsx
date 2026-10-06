// ALTERNA · MindMap chapter — the final mind map: a sequential vertical chain
// of concept cards, each linking back to its experiment.
import { Fragment, useEffect, useState } from 'react';
import { useT } from '../i18n';
import { useReducedMotion } from '../hooks';

const REVEAL_MS = 350;

function NodeCard({
  href,
  label,
  index,
  reduced,
}: {
  href: string;
  label: string;
  index: number;
  reduced: boolean;
}) {
  // Entrance animation: mount hidden, then flip to visible so the CSS
  // transition plays. Skipped entirely under reduced motion.
  const [entered, setEntered] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <div role="listitem">
      <a
        href={href}
        style={{
          display: 'block',
          maxWidth: 420,
          margin: '0 auto',
          padding: '14px 22px',
          borderRadius: 14,
          border: '2px solid rgba(59,130,246,.5)',
          background: 'rgba(59,130,246,.08)',
          boxShadow: '0 0 24px rgba(59,130,246,.18)',
          color: '#e8eefb',
          fontWeight: 700,
          fontSize: 17,
          textDecoration: 'none',
          textAlign: 'center',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(18px)',
          transition: reduced ? undefined : 'opacity 480ms ease, transform 480ms ease',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'block',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: 11,
            letterSpacing: '0.2em',
            color: 'rgba(232,238,251,.55)',
            marginBottom: 6,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        {label}
      </a>
    </div>
  );
}

export default function MindMap() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const nodes = t.map.nodes;
  const [shown, setShown] = useState(reduced ? nodes.length : 0);

  // Reveal one node every REVEAL_MS; show all at once under reduced motion.
  useEffect(() => {
    if (reduced) {
      setShown(nodes.length);
      return;
    }
    setShown(0);
    const id = window.setInterval(() => {
      setShown((c) => {
        if (c >= nodes.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, REVEAL_MS);
    return () => window.clearInterval(id);
  }, [reduced, nodes.length]);

  return (
    <div role="list" aria-label={t.map.title} style={{ padding: '10px 0 6px' }}>
      {nodes.slice(0, shown).map((n, i) => (
        <Fragment key={`${n.id}-${i}`}>
          {i > 0 && (
            <div
              aria-hidden="true"
              style={{ textAlign: 'center', color: '#f59e0b', fontSize: 24, lineHeight: 1.1, margin: '8px 0' }}
            >
              ↓
            </div>
          )}
          <NodeCard href={`#/cap/${n.id}`} label={n.t} index={i} reduced={reduced} />
        </Fragment>
      ))}
    </div>
  );
}
