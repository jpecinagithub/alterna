// ALTERNA · Quiz chapter — 8 conceptual questions. Options keep their fixed
// order (no reshuffling); best score persists in localStorage via the store.
import { useState, type CSSProperties } from 'react';
import { useT } from '../i18n';
import { useStore } from '../store';

const N = 8;

const cardStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 14,
  padding: '18px 20px',
  marginBottom: 16,
};

function optionStyle(state: 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed'): CSSProperties {
  const base: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
    textAlign: 'left',
    borderRadius: 10,
    padding: '10px 14px',
    marginBottom: 8,
    fontSize: 15,
    lineHeight: 1.45,
    color: '#e8eefb',
    cursor: 'pointer',
    transition: 'border-color 160ms ease, background 160ms ease',
  };
  switch (state) {
    case 'selected':
      return { ...base, background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.85)' };
    case 'correct':
      return { ...base, background: 'rgba(22,163,74,.14)', border: '2px solid #16a34a', cursor: 'default' };
    case 'wrong':
      return { ...base, background: 'rgba(220,38,38,.12)', border: '2px solid #dc2626', cursor: 'default' };
    case 'dimmed':
      return { ...base, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.1)', opacity: 0.55, cursor: 'default' };
    default:
      return { ...base, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.16)' };
  }
}

export default function Quiz() {
  const { t } = useT();
  const { store, patch } = useStore();
  const questions = t.quiz.questions;

  const [answers, setAnswers] = useState<(number | null)[]>(() => Array.from({ length: N }, () => null));
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers.every((a) => a !== null);
  const score = submitted ? questions.reduce((acc, q, i) => acc + (answers[i] === q.ok ? 1 : 0), 0) : 0;

  function choose(qi: number, oi: number) {
    if (submitted) return;
    setAnswers((prev) => prev.map((a, j) => (j === qi ? oi : a)));
  }

  function submit() {
    if (submitted || !allAnswered) return;
    setSubmitted(true);
    const s = questions.reduce((acc, q, i) => acc + (answers[i] === q.ok ? 1 : 0), 0);
    if (store.quizBest === null || s > store.quizBest) patch({ quizBest: s });
  }

  function restart() {
    setAnswers(Array.from({ length: N }, () => null));
    setSubmitted(false);
  }

  return (
    <div>
      {questions.map((q, qi) => {
        const qid = `quiz-q-${qi}`;
        return (
          <section key={qid} aria-labelledby={qid} style={cardStyle}>
            <h3 id={qid} style={{ margin: '0 0 4px', fontSize: 16, lineHeight: 1.5, color: '#e8eefb' }}>
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: 12,
                  color: 'rgba(232,238,251,.55)',
                  marginRight: 8,
                }}
              >
                {qi + 1}/{N}
              </span>
              {q.q}
            </h3>
            <div role="group" aria-label={q.q} style={{ marginTop: 12 }}>
              {q.opts.map((opt, oi) => {
                const isCorrect = oi === q.ok;
                const isSelected = answers[qi] === oi;
                const state = !submitted ? (isSelected ? 'selected' : 'idle') : isCorrect ? 'correct' : isSelected ? 'wrong' : 'dimmed';
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() => choose(qi, oi)}
                    aria-pressed={!submitted && isSelected}
                    style={optionStyle(state)}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        background: 'rgba(255,255,255,.08)',
                        border: '1px solid rgba(255,255,255,.18)',
                      }}
                    >
                      {submitted && isCorrect ? '✓' : submitted && isSelected ? '✗' : String.fromCharCode(65 + oi)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div
                role="note"
                style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(59,130,246,.08)',
                  border: '1px solid rgba(59,130,246,.32)',
                  color: '#e8eefb',
                  fontSize: 14,
                  lineHeight: 1.55,
                }}
              >
                <strong style={{ color: '#93c5fd' }}>💡 </strong>
                {q.why}
              </div>
            )}
          </section>
        );
      })}

      {!submitted ? (
        <button
          type="button"
          onClick={submit}
          disabled={!allAnswered}
          style={{
            display: 'block',
            width: '100%',
            padding: '14px 22px',
            borderRadius: 14,
            border: 'none',
            background: allAnswered ? '#2563eb' : 'rgba(255,255,255,.08)',
            color: allAnswered ? '#fff' : 'rgba(232,238,251,.5)',
            fontWeight: 700,
            fontSize: 16,
            cursor: allAnswered ? 'pointer' : 'not-allowed',
          }}
        >
          {t.quiz.cta}
        </button>
      ) : (
        <div
          style={{
            ...cardStyle,
            textAlign: 'center',
            borderColor: 'rgba(59,130,246,.4)',
            background: 'rgba(59,130,246,.08)',
          }}
        >
          <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#e8eefb' }}>
            {t.quiz.score} {score}/{N}
          </p>
          {store.quizBest !== null && (
            <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(232,238,251,.65)' }}>
              {t.quiz.best}: {store.quizBest}/{N}
            </p>
          )}
          {score >= 6 && (
            <div
              style={{
                margin: '0 0 14px',
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(22,163,74,.14)',
                border: '2px solid #16a34a',
                color: '#e8eefb',
              }}
            >
              <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800 }}>🎉 {t.quiz.final}</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'rgba(232,238,251,.85)' }}>{t.quiz.finalSub}</p>
            </div>
          )}
          <button
            type="button"
            onClick={restart}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,.2)',
              background: 'rgba(255,255,255,.06)',
              color: '#e8eefb',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            {t.quiz.restart}
          </button>
        </div>
      )}
    </div>
  );
}
