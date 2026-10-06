import { useEffect, useRef, useState, useCallback } from 'react';

/** Shared simulation clock: accumulates simulated seconds at `speed`x while playing. */
export function useSimClock(opts: { playing: boolean; speed: number; startAt?: number }) {
  const { playing, speed } = opts;
  const [time, setTime] = useState(opts.startAt ?? 0);
  const acc = useRef(opts.startAt ?? 0);
  const last = useRef<number | null>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (last.current == null) last.current = now;
      const dt = Math.min(0.1, (now - last.current) / 1000);
      last.current = now;
      acc.current += dt * speedRef.current;
      setTime(acc.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const reset = useCallback(() => {
    acc.current = 0;
    setTime(0);
  }, []);

  return { time, reset, setTimeExternal: (v: number) => { acc.current = v; setTime(v); } };
}

/** rAF-driven value for continuous pointer-driven animations (returns a tick counter). */
export function useRaf(active: boolean, onTick: (dt: number) => void) {
  const cb = useRef(onTick);
  cb.current = onTick;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      cb.current(dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active ]);
}

/** Honor prefers-reduced-motion: returns true when the user asked for less motion. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return reduced;
}
