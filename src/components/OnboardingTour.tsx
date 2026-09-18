"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "agentia_onboarding_step";
const UPDATE_EVENT = "agentia-onboarding-updated";
const GREEN = "#0A8F5C";
const INK = "#0E0E0E";
const BUBBLE_WIDTH = 280;

type StepConfig = {
  step: number;
  kind: "bubble" | "modal";
  primarySelector?: string;
  // Nav targets can be hidden behind a collapsed mobile menu — falls back
  // to that menu's own toggle button when the primary target isn't visible.
  fallbackSelector?: string;
  text: string;
  showOn: (pathname: string) => boolean;
  // Present = auto-advances once the pathname matches (arrival-based).
  // Absent = needs the bubble's own "Entendido" button (step 3 — filling
  // out a form has no "next page" to detect).
  advanceOn?: (pathname: string) => boolean;
};

const STEPS: StepConfig[] = [
  {
    step: 1,
    kind: "bubble",
    primarySelector: '[data-tour="tour-mi-panel"]',
    fallbackSelector: '[data-tour="tour-mi-panel-mobile"]',
    text: "Paso 1 · Completá tu perfil",
    showOn: () => true,
    advanceOn: (p) => p === "/panel",
  },
  {
    step: 2,
    kind: "bubble",
    primarySelector: '[data-tour="tour-perfil"]',
    fallbackSelector: '[data-tour="tour-panel-nav-mobile"]',
    text: "Paso 2 · Andá a tu Perfil",
    showOn: (p) => p.startsWith("/panel"),
    advanceOn: (p) => p === "/panel/perfil",
  },
  {
    step: 3,
    kind: "bubble",
    primarySelector: '[data-tour="tour-perfil-form"]',
    text: "Paso 3 · Agregá tu foto, logotipo y completá tus datos",
    showOn: (p) => p === "/panel/perfil",
  },
  {
    step: 4,
    kind: "bubble",
    primarySelector: '[data-tour="tour-agendamientos"]',
    fallbackSelector: '[data-tour="tour-panel-nav-mobile"]',
    text: "Paso 4 · Configurá tu disponibilidad",
    showOn: (p) => p.startsWith("/panel"),
    advanceOn: (p) => p === "/panel/agendamientos",
  },
  {
    step: 5,
    kind: "modal",
    text: "Ahora podés empezar a publicar tus propiedades. Pero antes, mejorá la calidad de tus fotos con nuestra herramienta de IA.",
    showOn: (p) => p === "/panel/agendamientos",
  },
];

function isVisible(el: Element | null): el is Element {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function useTargetRect(primarySelector: string | undefined, fallbackSelector: string | undefined, resetKey: string) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // No reset-to-null here when the selector is absent — the caller only
    // ever reads `rect` in the exact same condition under which it passes
    // a real selector in the first place, so a stale value sitting unused
    // is harmless, and this avoids a setState-in-effect on every render
    // where a bubble isn't shown.
    if (!primarySelector) return;
    let cancelled = false;
    let attempts = 0;
    let timer: number;

    function measure() {
      if (cancelled) return;
      const primary = document.querySelector(primarySelector!);
      const target = isVisible(primary) ? primary : fallbackSelector ? document.querySelector(fallbackSelector) : null;
      if (target) {
        setRect(target.getBoundingClientRect());
      } else if (attempts < 20) {
        // The target may not have mounted yet right after a route change —
        // a few retries is simpler than a MutationObserver for this scope.
        attempts++;
        timer = window.setTimeout(measure, 150);
      } else {
        setRect(null);
      }
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [primarySelector, fallbackSelector, resetKey]);

  return rect;
}

export function OnboardingTour() {
  const pathname = usePathname();
  const [step, setStep] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    function readStep() {
      const stored = localStorage.getItem(STORAGE_KEY);
      setStep(stored ? Number(stored) : null);
    }
    readStep();
    window.addEventListener(UPDATE_EVENT, readStep);
    return () => window.removeEventListener(UPDATE_EVENT, readStep);
  }, []);

  const advance = useCallback((next: number | null) => {
    setStep(next);
    if (next === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, String(next));
  }, []);

  const active = step !== null ? STEPS.find((s) => s.step === step) : undefined;

  // Arrival-based advancement, done during render rather than in an effect
  // (React's own documented pattern for "adjusting state when a prop
  // changes"). Calling setState here doesn't paint a stale intermediate
  // frame — React discards this render and immediately retries with the
  // updated state before committing anything to the DOM.
  //
  // Keyed on BOTH pathname and step, not just pathname: `step` only
  // becomes non-null one render after mount (it loads from localStorage
  // in an effect), so a plain pathname-only key would get "consumed" by
  // that first render — before `active` is known — and silently never
  // re-check once the real step loads, if the current page already
  // satisfies that step's arrival condition. Confirmed by reproducing
  // exactly this: a step whose target page matched where the tour was
  // already mounted got stuck and never auto-advanced.
  const checkKey = `${pathname}::${step}`;
  if (checkKey !== lastChecked) {
    setLastChecked(checkKey);
    if (active?.advanceOn && pathname && active.advanceOn(pathname)) {
      const next = STEPS.find((s) => s.step === active.step + 1);
      advance(next ? next.step : null);
    }
  }

  const visible = Boolean(active && pathname && active.showOn(pathname));

  const rect = useTargetRect(
    visible && active?.kind === "bubble" ? active.primarySelector : undefined,
    visible && active?.kind === "bubble" ? active.fallbackSelector : undefined,
    `${pathname}-${step}`
  );

  function handleSkip() {
    advance(null);
  }

  function handleNext() {
    if (!active) return;
    const next = STEPS.find((s) => s.step === active.step + 1);
    advance(next ? next.step : null);
  }

  if (!visible || !active) return null;

  if (active.kind === "modal") {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4">
        <div className="w-full max-w-md rounded-2xl p-6 text-center" style={{ backgroundColor: "#141414" }}>
          <p className="font-display text-lg font-semibold text-white">¡Todo listo!</p>
          <p className="mt-3 text-sm text-white/80">{active.text}</p>
          <Link
            href="/panel/servicios"
            onClick={handleSkip}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors"
            style={{ backgroundColor: GREEN, color: INK }}
          >
            Ir a Servicios
          </Link>
          <button type="button" onClick={handleSkip} className="mt-3 block w-full text-xs text-white/50 hover:text-white/70">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // A bubble step whose target hasn't been found (yet, or at all) renders
  // nothing rather than floating at a meaningless position.
  if (!rect) return null;

  const top = rect.bottom + 10;
  const left = Math.min(Math.max(rect.left, 12), window.innerWidth - BUBBLE_WIDTH - 12);

  return (
    <>
      <div
        className="pointer-events-none fixed z-[59] rounded-lg ring-2 transition-all"
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          boxShadow: `0 0 0 4px rgba(10,143,92,0.35)`,
          outline: `2px solid ${GREEN}`,
        }}
      />
      <div
        className="fixed z-[60] rounded-xl p-4 shadow-2xl"
        style={{ top, left, width: BUBBLE_WIDTH, backgroundColor: GREEN, border: "1px solid rgba(255,255,255,0.2)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-white">{active.text}</p>
          <button type="button" onClick={handleSkip} className="shrink-0 text-white/70 hover:text-white">
            <X size={14} />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button type="button" onClick={handleSkip} className="text-xs text-white/80 hover:text-white">
            Saltar guía
          </button>
          {!active.advanceOn && (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg px-3 py-1 text-xs font-semibold transition-colors"
              style={{ backgroundColor: "white", color: GREEN }}
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </>
  );
}
