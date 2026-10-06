# ALTERNA — Entiende la corriente alterna para siempre

Interactive educational web app (Spanish/English) that answers a single question:

> **What is alternating current, really — why does it appear, how is it generated, and why is it so useful?**

Pedagogy first: **intuition → manipulation → discovery → explanation**. No formulas to memorize, no exams — just play, observe, predict, change something, and discover.

## Journey

1. **DC intuition** — battery, switch, bulb, drifting electrons
2. **Magnet + coil** — drag the magnet yourself; discover that *change* of flux is what matters
3. **Spin it** — crank a generator and watch the sine wave being born (the big "aha!")
4. **Generator sandbox** — speed → frequency; field & turns → amplitude
5. **What 50 Hz means** — from 0.5 Hz to 50 Hz, with ×100 slow motion
6. **Electrons oscillate** — they don't travel from the power plant to your home
7. **The saw** — the analogy that settles "how does energy arrive if electrons go back?"
8. **DC vs AC face to face** — bulb, resistor, coil, transformer on each current
9. **The transformer** — why alternation is its superpower
10. **Turns & voltage** — 100/100, 100/200, 200/100
11. **Moving energy** — high voltage + low current; losses ∝ I²R
12. **Now: Tesla** — what he did and didn't do (only after you get it) + minimal timeline
13. **Rotating magnetic field** — three phases at 120°, a spinning arrow, a rotor that follows
14. **Final mind map** — 8 ideas; tap any node to revisit its experiment
15. **Do I get it?** — 8 conceptual questions, no formulas

Plus a **Lab** mode with direct access to every simulator.

## Stack

- Vite + React + TypeScript, no backend, no database, no auth
- SVG scenes + requestAnimationFrame; honest educational physics models
- Bilingual ES/EN (ES default), all copy centralized in `src/i18n.tsx`
- PWA: manifest, icons, service worker (Workbox), offline-first after first load
- Progress in `localStorage` only: language, completed experiments, quiz best, intuition/physics mode
- Vercel Analytics + Speed Insights

## Project structure

```
src/
  App.tsx            # hash routing (#/, #/lab, #/cap/<id>), landing, header/footer
  i18n.tsx           # full ES/EN dictionary + LangProvider/useT
  store.ts           # localStorage progress
  hooks.ts           # useSimClock, useRaf, useReducedMotion
  physics.ts         # sine, fluxFromPosition, clamp…
  theme.css          # design tokens + all styles
  components/
    ExperimentFrame.tsx  # chapter shell: sim + predict/what/insight/physics + nav
    WaveChart.tsx        # reusable SVG oscilloscope chart
    ui.tsx               # Slider, Seg, TimeControls, WhatSeeing, Prediction…
  sims/              # one component per experiment (default export, no props)
```

Simulation architecture per chapter: **UI → sim clock → physics model → SVG renderer**, kept inside each `src/sims/*.tsx`.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build (also validates PWA manifest)
npm run preview
```

## Deploy (Vercel)

Static output (`dist/`). No environment variables needed:

```bash
npm run build
vercel --prod        # or connect the repo in the Vercel dashboard
```

After deploying, enable **Web Analytics** and **Speed Insights** in the Vercel dashboard for the project (the code is already instrumented).

## Author

Created by Jon Peciña · jpecina@gmail.com
