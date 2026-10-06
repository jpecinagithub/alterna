// Persistent lightweight progress in localStorage. No backend, no accounts.
import { useState, useEffect, useCallback } from 'react';
import type { Lang } from './i18n';

const KEY = 'alterna:v1';

export interface Store {
  lang: Lang;
  completed: string[];
  quizBest: number | null;
  physicsMode: boolean;
  lastChapter: string | null;
}

const defaults: Store = {
  lang: 'es',
  completed: [],
  quizBest: null,
  physicsMode: false,
  lastChapter: null,
};

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed, lang: parsed.lang === 'en' ? 'en' : 'es' };
  } catch {
    return defaults;
  }
}

export function useStore() {
  const [store, setStore] = useState<Store>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch {
      /* storage unavailable — app still works */
    }
  }, [store]);

  const patch = useCallback((p: Partial<Store>) => setStore((s) => ({ ...s, ...p })), []);

  const markDone = useCallback((id: string) => {
    setStore((s) => (s.completed.includes(id) ? s : { ...s, completed: [...s.completed, id] }));
  }, []);

  return { store, patch, markDone };
}
