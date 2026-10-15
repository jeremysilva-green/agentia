"use client";

import { Fragment, useEffect, type CSSProperties } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { PLANS, PLAN_ORDER, FUNDADOR_SEAT_LIMIT } from "@/lib/plans";
import { AFFILIATE_COMMISSION_PCT } from "@/lib/constants/commission";
import styles from "./HomePage.module.css";

function Icon({ name, className, style }: { name: string; className?: string; style?: CSSProperties }) {
  return (
    <svg className={cn(styles.ico, className)} style={style}>
      <use href={`#i-${name}`} />
    </svg>
  );
}

// Reused for both the before/after slider's two layers — a plain static
// illustration, not a real photo, matching the rest of this page's mockup
// aesthetic (the property "sheet" card, the reel phone shots).
function RoomIllustration() {
  return (
    <svg className={styles.room} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="#e9e2d6" />
      <rect y="210" width="400" height="90" fill="#b98d62" />
      <rect x="40" y="40" width="130" height="120" rx="4" fill="#bfe3f2" />
      <path d="M105 40v120M40 100h130" stroke="#fff" strokeWidth="5" />
      <rect x="34" y="34" width="142" height="132" rx="6" fill="none" stroke="#fff" strokeWidth="7" />
      <rect x="200" y="150" width="170" height="60" rx="14" fill="#2f6f57" />
      <rect x="208" y="125" width="154" height="40" rx="14" fill="#3b8a6c" />
      <rect x="220" y="208" width="10" height="16" fill="#3a2a1d" />
      <rect x="340" y="208" width="10" height="16" fill="#3a2a1d" />
      <circle cx="300" cy="70" r="26" fill="#f4d58d" />
      <path d="M300 20v24M300 96v14" stroke="#c9a961" strokeWidth="3" />
      <rect x="70" y="190" width="70" height="40" rx="6" fill="#efe6d8" />
      <path d="M90 190c-10-30 10-40 15-60 5 20 25 30 15 60z" fill="#4f9b6e" />
    </svg>
  );
}

const marqueeItems = [
  { icon: "grid", label: "Portafolio con tu marca" },
  { icon: "bot", label: "Asistente IA 24/7" },
  { icon: "db", label: "CRM centralizado" },
  { icon: "cal", label: "Visitas automáticas" },
  { icon: "pen", label: "Firma digital" },
  { icon: "share", label: "Red de afiliados" },
  { icon: "spark", label: "Fotos con IA" },
  { icon: "film", label: "Reels automáticos" },
];

const timelineSteps = [
  { title: "Creá tu cuenta", text: "Registrate como agente en minutos. Es gratis y no necesitás tarjeta." },
  {
    title: "Armá tu portafolio",
    text: "Cargá tus propiedades y personalizalo con tu marca. Cada propiedad tiene su propia ficha lista para compartir.",
  },
  {
    title: "Recibí leads y vendé",
    text: "El asistente con IA atiende a los interesados y la red de afiliados lleva tus propiedades más lejos.",
  },
];

const bentoAfter = [
  { icon: "palette", title: "Portafolio con tu marca", text: "Una página pública profesional con tu identidad y todas tus propiedades." },
  { icon: "magnet", title: "Captura de leads", text: "Cada conversación del chat se convierte en un lead, de forma automática." },
];

const aiList = [
  "Arrastrá la imagen y listo",
  "Más luz y color, sin editar a mano",
  "Lista para publicar y compartir",
];

const starStats = [
  { value: "Gs. 0", label: "costo por adelantado" },
  { value: `${AFFILIATE_COMMISSION_PCT}%`, label: "para el afiliado, solo si se vende" },
  { value: "24/7", label: "tu propiedad circulando" },
];

const starFlow = [
  { n: "1", title: "Publicás", text: "Tu propiedad entra a la red." },
  { n: "2", title: "Los afiliados comparten", text: "WhatsApp, Instagram, sus contactos." },
  { n: "3", title: "Los leads llegan a vos", text: "Directo a tu CRM, todo registrado." },
  { n: "✓", title: "Vendés", text: "Y recién ahí se paga la comisión.", hl: true },
];

const affCards = [
  { icon: "link", title: "Tu link por propiedad", text: "Generá un enlace único para cada propiedad y compartilo donde quieras." },
  { icon: "cash", big: `${AFFILIATE_COMMISSION_PCT}%`, text: "de comisión por cada venta cerrada a través de tu link." },
  { icon: "chart", title: "Panel simple", text: "Clics, leads, ventas y comisiones, siempre a la vista." },
  { icon: "shield", title: "Riesgo cero", text: "Sin stock, sin oficina, sin costos fijos." },
];

const reelList = ["Formato vertical 9:16", "Tu logo y el precio incluidos", "Un clic para generar y compartir"];

export default function HomePage() {
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reveal on scroll
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.in);
            io.unobserve(entry.target);
          }
        }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(`.${styles.rv}`).forEach((el) => io.observe(el));
    const once = (el: Element | null, fn: () => void, threshold = 0.35) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries, o) => {
          if (entries[0].isIntersecting) {
            fn();
            o.disconnect();
          }
        },
        { threshold }
      );
      obs.observe(el);
      return obs;
    };

    // Scroll-driven effects: progress bar, hero screen tilt, floating
    // bubble parallax, timeline fill
    const prog = document.getElementById("prog");
    const screen = document.getElementById("screen");
    const floats = document.querySelectorAll<HTMLElement>(`.${styles.float}[data-par]`);
    const timeline = document.getElementById("timeline");
    const tfill = document.getElementById("tfill");
    const tsteps = document.querySelectorAll<HTMLElement>(`.${styles.tstep}`);
    function onScroll() {
      const y = scrollY;
      const h = document.documentElement.scrollHeight - innerHeight;
      if (prog) prog.style.width = (y / h) * 100 + "%";
      if (!reduce && screen) {
        const r = screen.getBoundingClientRect();
        const p = Math.min(Math.max(1 - r.top / innerHeight, 0), 1);
        screen.style.transform = `rotateX(${Math.max(18 - p * 30, 0)}deg) scale(${0.94 + Math.min(p, 1) * 0.06})`;
        floats.forEach((f) => {
          f.style.transform = `translateY(${y * parseFloat(f.dataset.par || "0")}px)`;
        });
      }
      if (timeline && tfill) {
        const tr = timeline.getBoundingClientRect();
        const mid = innerHeight * 0.6;
        const prog2 = Math.min(Math.max((mid - tr.top) / tr.height, 0), 1);
        tfill.style.height = prog2 * (tr.height - 20) + "px";
        tsteps.forEach((s) => {
          const sr = s.getBoundingClientRect();
          s.classList.toggle(styles.on, sr.top < mid);
        });
      }
    }
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Tile spotlight
    const tiles = document.querySelectorAll<HTMLElement>(`.${styles.tile}`);
    const tileHandler = (e: PointerEvent) => {
      const t = e.currentTarget as HTMLElement;
      const r = t.getBoundingClientRect();
      t.style.setProperty("--mx", e.clientX - r.left + "px");
      t.style.setProperty("--my", e.clientY - r.top + "px");
    };
    tiles.forEach((t) => t.addEventListener("pointermove", tileHandler));

    // Chat + bars stagger
    const chatObs = once(document.getElementById("chat"), () =>
      document.querySelectorAll(`#chat .${styles.bub}`).forEach((b, i) => setTimeout(() => b.classList.add(styles.in), reduce ? 0 : i * 900))
    );
    const barsObs = once(document.getElementById("bars"), () =>
      document.querySelectorAll<HTMLElement>("#bars i").forEach((b, i) => setTimeout(() => (b.style.height = (b.dataset.h || "0") + "%"), i * 120))
    );

    // Before/after: auto sweep then draggable
    const ba = document.getElementById("ba");
    let dragging = false;
    let auto = true;
    const setCut = (v: number) => ba?.style.setProperty("--cut", Math.min(Math.max(v, 0), 100) + "%");
    const fromEv = (e: PointerEvent) => {
      const r = ba!.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * 100;
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      auto = false;
      ba?.setPointerCapture(e.pointerId);
      setCut(fromEv(e));
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) setCut(fromEv(e));
    };
    const onUp = () => {
      dragging = false;
    };
    ba?.addEventListener("pointerdown", onDown);
    ba?.addEventListener("pointermove", onMove);
    ba?.addEventListener("pointerup", onUp);
    const baObs = once(ba, () => {
      if (reduce) return;
      const t0 = performance.now();
      const f = (n: number) => {
        if (!auto) return;
        const t = (n - t0) / 1000;
        setCut(50 + Math.sin(t * 1.1) * 38);
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    });

    // Counters
    function count(el: Element) {
      const to = +(el.getAttribute("data-count") || 0);
      const pre = el.getAttribute("data-pre") || "";
      const t0 = performance.now();
      const d = reduce ? 1 : 1600;
      const f = (n: number) => {
        const p = Math.min((n - t0) / d, 1);
        const v = Math.round(to * (1 - Math.pow(1 - p, 3)));
        el.textContent = pre + v.toLocaleString("es-PY");
        if (p < 1) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }
    const panelObs = once(document.getElementById("panel"), () => {
      document.querySelectorAll("#panel [data-count]").forEach(count);
      document.getElementById("spark")?.classList.add("go");
    });

    // Affiliate network spotlight
    let netObs: IntersectionObserver | undefined;
    let toastInterval: ReturnType<typeof setInterval> | undefined;
    const netSvg = document.getElementById("net");
    if (netSvg) {
      const NS = "http://www.w3.org/2000/svg";
      const el = (name: string, attrs: Record<string, string | number>) => {
        const e = document.createElementNS(NS, name);
        for (const k in attrs) e.setAttribute(k, String(attrs[k]));
        return e;
      };
      const C = 300;
      const A = 10;
      const R1 = 150;
      const R2 = 262;
      const gL = el("g", {});
      const gM = el("g", {});
      const gN = el("g", {});
      const orbit = el("g", { class: "orbit" });
      orbit.append(gL, gM, gN);
      netSvg.append(orbit);
      const pts: [number, number][] = [];
      for (let i = 0; i < A; i++) {
        const a = (i / A) * Math.PI * 2 - Math.PI / 2;
        const x = C + Math.cos(a) * R1;
        const y = C + Math.sin(a) * R1;
        pts.push([x, y]);
        gL.append(el("path", { d: `M${C},${C}L${x},${y}`, class: "netLine" }));
        gN.append(el("circle", { cx: x, cy: y, r: 16, class: "aff", style: `transition-delay:${0.1 + i * 0.08}s` }));
        gN.append(
          el("use", {
            href: "#i-user",
            x: x - 8,
            y: y - 8,
            width: 16,
            height: 16,
            style: "color:#13C47F;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round",
          })
        );
        for (let j = -1; j <= 1; j++) {
          const b = a + j * 0.17;
          const bx = C + Math.cos(b) * R2;
          const by = C + Math.sin(b) * R2;
          gL.append(el("path", { d: `M${x},${y}L${bx},${by}`, class: "netLine" }));
          gN.append(el("circle", { cx: bx, cy: by, r: 5, class: "buy", style: `transition-delay:${0.7 + i * 0.06}s` }));
          if (!reduce) {
            const d = el("circle", { r: 3.2, fill: "#13C47F" });
            d.append(
              el("animateMotion", {
                dur: `${2.4 + Math.random() * 1.6}s`,
                repeatCount: "indefinite",
                begin: `${Math.random() * 2.5}s`,
                path: `M${C},${C}L${x},${y}L${bx},${by}`,
              })
            );
            gM.append(d);
          }
        }
      }
      [0, 1.5].forEach((d) => gN.append(el("circle", { cx: C, cy: C, r: 42, class: "pulse", style: `animation-delay:${d}s` })));
      gN.append(el("circle", { cx: C, cy: C, r: 42, fill: "#0A8F5C" }));
      gN.append(
        el("use", {
          href: "#i-home",
          x: C - 19,
          y: C - 19,
          width: 38,
          height: 38,
          style: "color:#fff;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round",
        })
      );

      const names = ["Ana", "Diego", "Lucía", "Marcos", "Sofía", "Rodrigo", "Paula", "Iván"];
      const chans = ["WhatsApp", "Instagram", "Facebook", "TikTok", "sus contactos"];
      const box = document.getElementById("toasts");
      let k = 0;
      function toast() {
        if (!box) return;
        const [x, y] = pts[(k * 3) % A];
        k++;
        const t = document.createElement("div");
        t.className = "toast";
        const n = names[k % names.length];
        t.innerHTML = `<i>${n[0]}</i><span><b>${n}</b> compartió en ${chans[k % chans.length]}</span>`;
        const top = Math.min(Math.max((y / 600) * 100 - 6, 4), 82);
        if (x < 300) t.style.left = Math.max((x / 600) * 100 - 4, 0) + "%";
        else t.style.right = Math.max(100 - (x / 600) * 100 - 4, 0) + "%";
        t.style.top = top + "%";
        box.append(t);
        setTimeout(() => t.remove(), 3300);
      }
      netObs = once(netSvg, () => {
        netSvg.classList.add("go");
        const e = document.getElementById("netCount");
        const t0 = performance.now();
        const f = (n: number) => {
          const p = Math.min((n - t0) / 1800, 1);
          if (e) e.textContent = String(Math.round(A * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
        if (!reduce) {
          toast();
          toastInterval = setInterval(toast, 1900);
        }
      }, 0.3);
    }

    return () => {
      removeEventListener("scroll", onScroll);
      io.disconnect();
      chatObs?.disconnect();
      barsObs?.disconnect();
      baObs?.disconnect();
      panelObs?.disconnect();
      netObs?.disconnect();
      if (toastInterval) clearInterval(toastInterval);
      ba?.removeEventListener("pointerdown", onDown);
      ba?.removeEventListener("pointermove", onMove);
      ba?.removeEventListener("pointerup", onUp);
      tiles.forEach((t) => t.removeEventListener("pointermove", tileHandler));
    };
  }, []);

  function handlePlay() {
    const v = document.getElementById("introVideo") as HTMLVideoElement | null;
    const btn = document.getElementById("playBtn");
    if (!v) return;
    v.style.display = "block";
    v.muted = false;
    v.controls = true;
    v.play().catch(() => {});
    if (btn) btn.style.display = "none";
  }

  return (
    <div className={styles.page}>
      <div id="prog" />

      {/* ICON SPRITE */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="gr" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#13C47F" stopOpacity=".35" />
            <stop offset="1" stopColor="#13C47F" stopOpacity="0" />
          </linearGradient>
        </defs>
        <symbol id="i-home" viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></symbol>
        <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></symbol>
        <symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></symbol>
        <symbol id="i-bot" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 4v4M9 14h.01M15 14h.01M2 13v3M22 13v3" /></symbol>
        <symbol id="i-share" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></symbol>
        <symbol id="i-palette" viewBox="0 0 24 24"><path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.4 3.4A2 2 0 0 1 12 22z" /><circle cx="7.5" cy="10.5" r="1" /><circle cx="12" cy="7" r="1" /><circle cx="16.5" cy="10.5" r="1" /></symbol>
        <symbol id="i-msg" viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" /></symbol>
        <symbol id="i-magnet" viewBox="0 0 24 24"><path d="M6 15V8a6 6 0 0 1 12 0v7a6 6 0 0 1-12 0zM6 9h4M14 9h4" /></symbol>
        <symbol id="i-cal" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></symbol>
        <symbol id="i-db" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></symbol>
        <symbol id="i-chart" viewBox="0 0 24 24"><path d="M3 3v18h18M7 15l4-4 3 3 5-6" /></symbol>
        <symbol id="i-pen" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></symbol>
        <symbol id="i-link" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></symbol>
        <symbol id="i-cash" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></symbol>
        <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></symbol>
        <symbol id="i-spark" viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></symbol>
        <symbol id="i-play" viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" /></symbol>
        <symbol id="i-film" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4" /></symbol>
        <symbol id="i-bed" viewBox="0 0 24 24"><path d="M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-8v3M7 11h.01" /></symbol>
        <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></symbol>
        <symbol id="i-area" viewBox="0 0 24 24"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" /></symbol>
        <symbol id="i-wa" viewBox="0 0 24 24"><path d="M3 21l1.7-5A9 9 0 1 1 8 19.3z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z" /></symbol>
        <symbol id="i-trophy" viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></symbol>
        <symbol id="i-crown" viewBox="0 0 24 24"><path d="M3 18h18M4 7l4 4 4-6 4 6 4-4-2 11H6z" /></symbol>
      </svg>

      {/* HERO */}
      <header className={styles.hero}>
        <div className={styles.glow} />
        <div className={styles.dots} />
        <div className={styles.wrap}>
          <div className={cn(styles.pill, styles.rv, styles.in)}>
            <b>Nuevo</b>CRM, asistente con IA y red de afiliados en un solo lugar
          </div>
          <h1>
            <span className={styles.line}>
              <span>Vendé más propiedades,</span>
            </span>
            <span className={styles.line}>
              <span style={{ animationDelay: ".15s" }}>
                con <span className={styles.em}>menos trabajo.</span>
              </span>
            </span>
          </h1>
          <p className={cn(styles.lead, styles.rv, styles.d3)}>
            Tu portafolio, tu CRM, un asistente con IA que atiende 24/7 y una red de afiliados que difunde tus
            propiedades. Todo en una sola plataforma.
          </p>
          <div className={cn(styles.ctas, styles.rv, styles.d4)}>
            <Link href="/registro" className={cn(styles.btn, styles.pri)}>
              Empezá gratis <Icon name="arrow" />
            </Link>
            <a href="#planes" className={cn(styles.btn, styles.sec)}>
              Ver planes
            </a>
          </div>
          <div className={cn(styles.note, styles.rv, styles.d5)}>
            <span>
              <Icon name="check" />
              Gratis para empezar
            </span>
            <span>
              <Icon name="check" />
              Sin tarjeta
            </span>
            <span>
              <Icon name="check" />
              Listo en minutos
            </span>
          </div>

          <div className={cn(styles.stage, styles.rv, styles.z, styles.d5)}>
            <div className={cn(styles.float, styles.f1)} data-par="-0.12">
              <div className={styles.bob} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className={styles.fi}>
                  <Icon name="msg" />
                </div>
                <div>
                  <b>Nuevo lead</b>
                  <span>desde el chat de tu propiedad</span>
                </div>
              </div>
            </div>
            <div className={cn(styles.float, styles.f2)} data-par="-0.2">
              <div className={styles.bob} style={{ display: "flex", gap: 12, alignItems: "center", animationDelay: "-1.5s" }}>
                <div className={styles.fi}>
                  <Icon name="cal" />
                </div>
                <div>
                  <b>Visita agendada</b>
                  <span>Sábado · 10:30</span>
                </div>
              </div>
            </div>
            <div className={cn(styles.float, styles.f3)} data-par="-0.08">
              <div className={styles.bob} style={{ display: "flex", gap: 12, alignItems: "center", animationDelay: "-3s" }}>
                <div className={styles.fi}>
                  <Icon name="share" />
                </div>
                <div>
                  <b>+12 afiliados</b>
                  <span>compartiendo tu propiedad</span>
                </div>
              </div>
            </div>
            <div className={cn(styles.float, styles.f4)} data-par="-0.16">
              <div className={styles.bob} style={{ display: "flex", gap: 12, alignItems: "center", animationDelay: "-2s" }}>
                <div className={styles.fi}>
                  <Icon name="pen" />
                </div>
                <div>
                  <b>Contrato firmado</b>
                  <span>desde el celular</span>
                </div>
              </div>
            </div>
            <div className={styles.screen} id="screen">
              <div className={styles.bar}>
                <i /><i /><i />
                <div className={styles.url}>agentia.com.py</div>
              </div>
              <div className={styles.ph} id="vid">
                <video
                  id="introVideo"
                  src="/video/agentia-intro.mp4"
                  poster="/video/agentia-intro-poster.jpg"
                  playsInline
                  muted
                  loop
                  preload="none"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "none" }}
                />
                <button className={styles.play} id="playBtn" aria-label="Ver video" onClick={handlePlay} type="button">
                  <Icon name="play" style={{ fill: "#fff", stroke: "none", marginLeft: 5 }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MARQUEE */}
      <div className={styles.marquee}>
        <div className={styles.track}>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i}>
              <Icon name={item.icon} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="como">
        <div className={styles.wrap}>
          <div className={cn(styles.eyebrow, styles.rv)}>Cómo funciona</div>
          <h2 className={cn(styles.secTitle, styles.rv, styles.d1)}>
            De cero a vender en <span className={styles.em}>tres pasos.</span>
          </h2>
          <div className={styles.stepsGrid}>
            <div className={styles.timeline} id="timeline">
              <div className={styles.rail} />
              <div className={styles.fill} id="tfill" />
              {timelineSteps.map((step, i) => (
                <div key={step.title} className={cn(styles.tstep, styles.rv)}>
                  <div className={styles.n}>{i + 1}</div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>
            <div className={cn(styles.rv, styles.r, styles.d2)} style={{ position: "relative" }}>
              <div className={styles.sheet}>
                <div className={styles.oneclick}>Ficha en 1 clic ⚡</div>
                <div className={styles.img}>
                  <span className={styles.price}>USD 185.000</span>
                  <svg viewBox="0 0 300 180">
                    <path d="M30 180V90l90-60 90 60v90z" fill="#fff" />
                    <path d="M20 95 120 25l100 70" stroke="#0E0E0E" strokeWidth="8" fill="none" strokeLinejoin="round" />
                    <rect x="95" y="120" width="40" height="60" fill="#0A8F5C" />
                    <rect x="155" y="105" width="35" height="30" fill="#bfe3f2" />
                    <rect x="50" y="105" width="30" height="30" fill="#bfe3f2" />
                    <rect x="200" y="120" width="80" height="60" fill="#f2f2f2" />
                    <path d="M200 120l40-30 40 30" fill="#ddd" />
                  </svg>
                </div>
                <div className={styles.body}>
                  <h4>Casa moderna en Luque</h4>
                  <div className={styles.meta}>
                    <span>
                      <Icon name="bed" />3 dorm.
                    </span>
                    <span>
                      <Icon name="area" />
                      220 m²
                    </span>
                    <span>
                      <Icon name="pin" />
                      Luque
                    </span>
                  </div>
                  <div className={styles.agent}>
                    <div className={styles.av}>JS</div>
                    <div>
                      <b>Tu nombre</b>
                      <span>Agente Agentia</span>
                    </div>
                    <div className={styles.wa}>WhatsApp</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AGENTS */}
      <section id="agentes" style={{ paddingTop: 40 }}>
        <div className={styles.wrap}>
          <div className={cn(styles.eyebrow, styles.rv)}>Para agentes</div>
          <h2 className={cn(styles.secTitle, styles.rv, styles.d1)}>
            Todo lo que necesitás para vender. <span className={styles.em}>Nada que te sobre.</span>
          </h2>
          <div className={styles.bento}>
            <div className={cn(styles.tile, styles.wide, styles.rv, styles.d1)}>
              <div className={styles.ti}>
                <Icon name="bot" />
              </div>
              <h4>Asistente con IA 24/7</h4>
              <p>Responde las consultas de los compradores sobre tus propiedades a cualquier hora.</p>
              <div className={styles.chat} id="chat">
                <div className={cn(styles.bub, styles.u)}>¿La casa de Luque tiene cochera?</div>
                <div className={cn(styles.bub, styles.a)}>¡Sí! Tiene cochera para 2 autos. ¿Querés agendar una visita?</div>
                <div className={cn(styles.bub, styles.u)}>Sí, el sábado si se puede 🙌</div>
                <div className={cn(styles.bub, styles.a)}>
                  <span className={styles.typing}>
                    <i /><i /><i />
                  </span>
                </div>
              </div>
            </div>
            {bentoAfter.map((item, i) => (
              <div key={item.title} className={cn(styles.tile, styles.rv, styles[`d${i + 2}` as "d2" | "d3"])}>
                <div className={styles.ti}>
                  <Icon name={item.icon} />
                </div>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </div>
            ))}
            <div className={cn(styles.tile, styles.rv, styles.d4)}>
              <div className={styles.ti}>
                <Icon name="cal" />
              </div>
              <h4>Visitas automáticas</h4>
              <p>Se agendan según tu disponibilidad real.</p>
              <div className={styles.cal}>
                <i>L</i>
                <i className={styles.busy}>M</i>
                <i>M</i>
                <i className={styles.busy}>J</i>
                <i>V</i>
                <i className={styles.pick}>S</i>
                <i className={styles.busy}>D</i>
              </div>
            </div>
            <div className={cn(styles.tile, styles.rv, styles.d5)}>
              <div className={styles.ti}>
                <Icon name="db" />
              </div>
              <h4>CRM centralizado</h4>
              <p>Clientes, seguimientos y oportunidades en un solo lugar.</p>
            </div>
            <div className={cn(styles.tile, styles.rv, styles.d6)}>
              <div className={styles.ti}>
                <Icon name="chart" />
              </div>
              <h4>Métricas y reportes PDF</h4>
              <p>Una vista global de tu rendimiento, descargable.</p>
              <div className={styles.bars} id="bars">
                {[35, 55, 42, 70, 62, 90].map((h, i) => (
                  <i key={i} data-h={h} />
                ))}
              </div>
            </div>
            <div className={cn(styles.tile, styles.rv, styles.d7)}>
              <div className={styles.ti}>
                <Icon name="pen" />
              </div>
              <h4>Autorización con firma digital</h4>
              <p>El propietario firma la autorización de venta desde su celular.</p>
              <svg className={styles.sign} viewBox="0 0 220 60" preserveAspectRatio="none">
                <path d="M15 40c15-25 25-25 25-5s15-25 25-15 5 25 20 10 15-20 25-5 10 15 25 0 20-10 30-5 20 5 35-5" />
              </svg>
            </div>
          </div>

          <div className={styles.aiRow}>
            <div className={cn(styles.ba, styles.rv, styles.l)} id="ba">
              <div className={cn(styles.layer, styles.before)} id="baBefore">
                <RoomIllustration />
              </div>
              <div className={cn(styles.layer, styles.after)} id="baAfter">
                <RoomIllustration />
              </div>
              <span className={cn(styles.lab, styles.b)}>Antes</span>
              <span className={cn(styles.lab, styles.a)}>Con IA</span>
              <div className={styles.handle} />
            </div>
            <div className={cn(styles.rv, styles.r, styles.d2)}>
              <span className={styles.pro}>✦ Plan Pro</span>
              <h2 className={styles.secTitle} style={{ fontSize: "clamp(32px,4vw,48px)", marginTop: 16 }}>
                Fotos que venden, <span className={styles.em}>mejoradas con IA.</span>
              </h2>
              <p className={styles.secSub}>
                Subí la foto que sacaste con tu celular y obtené una versión con mejor luz, color y nitidez en
                segundos.
              </p>
              <div className={styles.list}>
                {aiList.map((item) => (
                  <div key={item}>
                    <Icon name="check" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AFFILIATE PROGRAM SPOTLIGHT */}
      <section className={styles.starSec} id="red">
        <div className={styles.wrap}>
          <div className={cn(styles.starBox, styles.rv, styles.z)}>
            <div className={styles.starBorder} />
            <div className={styles.starInner}>
              <div className={styles.starGrid}>
                <div className={styles.starCopy}>
                  <div className={styles.starBadge}>
                    <Icon name="crown" />
                    La función estrella de Agentia
                  </div>
                  <h2 className={styles.starTitle}>
                    Tu propiedad, <span className={styles.em}>vendida por una red entera.</span>
                  </h2>
                  <p className={styles.starLead}>
                    Con el programa de afiliados, cualquier persona puede difundir tus propiedades con su propio
                    link. Solo cobran comisión si la propiedad se vende: <b>vos no pagás nada por adelantado.</b>
                  </p>
                  <div className={styles.starStats}>
                    {starStats.map((s, i) => (
                      <div key={s.label} className={cn(styles.sstat, styles.rv, styles[`d${i + 1}` as "d1" | "d2" | "d3"])}>
                        <b>{s.value}</b>
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className={cn(styles.starCtas, styles.rv, styles.d4)}>
                    <Link href="/registro/agente" className={cn(styles.btn, styles.pri)}>
                      Activar mi red <Icon name="arrow" />
                    </Link>
                    <a href="#afiliados" className={cn(styles.btn, styles.sec)}>
                      Quiero ser afiliado
                    </a>
                  </div>
                </div>
                <div className={styles.starVis}>
                  <svg className={styles.net} id="net" viewBox="0 0 600 600" aria-label="Red de afiliados difundiendo una propiedad" />
                  <div className={styles.toasts} id="toasts" aria-hidden="true" />
                  <div className={styles.netCount}>
                    <b id="netCount">0</b>
                    <span>afiliados compartiendo</span>
                  </div>
                </div>
              </div>
              <div className={styles.starFlow}>
                {starFlow.map((step, i) => (
                  <Fragment key={step.title}>
                    <div className={cn(styles.fstep, step.hl && styles.hl, styles.rv, styles[`d${i + 1}` as "d1" | "d2" | "d3" | "d4"])}>
                      <span className={styles.fn}>{step.n}</span>
                      <div>
                        <b>{step.title}</b>
                        <span>{step.text}</span>
                      </div>
                    </div>
                    {i < starFlow.length - 1 && (
                      <svg className={styles.farrow} viewBox="0 0 40 12">
                        <path d="M0 6h36M30 1l6 5-6 5" />
                      </svg>
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AFFILIATES */}
      <section className={styles.affSec} id="afiliados">
        <div className={styles.dots} />
        <div className={styles.wrap} style={{ position: "relative" }}>
          <div className={cn(styles.eyebrow, styles.rv)}>Para afiliados</div>
          <h2 className={cn(styles.secTitle, styles.rv, styles.d1)}>
            Ganá dinero recomendando propiedades. <span className={styles.em}>Sin ser inmobiliaria.</span>
          </h2>
          <div className={styles.affGrid}>
            <div className={styles.acards}>
              {affCards.map((card, i) => (
                <div key={card.title ?? card.big} className={cn(styles.acard, styles.rv, styles[`d${i + 1}` as "d1" | "d2" | "d3" | "d4"])}>
                  <Icon name={card.icon} />
                  {card.title && <h4>{card.title}</h4>}
                  {card.big && <div className={styles.big}>{card.big}</div>}
                  <p>{card.text}</p>
                </div>
              ))}
            </div>
            <div className={cn(styles.panel, styles.rv, styles.r, styles.d2)} id="panel">
              <div className={styles.phTop}>
                <b>Tu panel de afiliado</b>
                <span className={styles.live}>En vivo</span>
              </div>
              <div className={styles.kpis}>
                <div className={styles.kpi}>
                  <span>Clics</span>
                  <b data-count="1284">0</b>
                </div>
                <div className={styles.kpi}>
                  <span>Leads</span>
                  <b data-count="46">0</b>
                </div>
                <div className={styles.kpi}>
                  <span>Ventas</span>
                  <b data-count="2">0</b>
                </div>
                <div className={cn(styles.kpi, styles.g)}>
                  <span>Comisión</span>
                  <b data-count="3700" data-pre="USD ">0</b>
                </div>
              </div>
              <div className={styles.spark} id="spark">
                <svg viewBox="0 0 400 110" preserveAspectRatio="none">
                  <path
                    className="ar"
                    d="M0 95 L50 88 L100 80 L150 84 L200 60 L250 52 L300 36 L350 30 L400 12 L400 110 L0 110Z"
                  />
                  <path className="ln" d="M0 95 L50 88 L100 80 L150 84 L200 60 L250 52 L300 36 L350 30 L400 12" />
                </svg>
              </div>
              <div className={styles.links}>
                <div className={styles.lk}>
                  <Icon name="link" style={{ width: 16, height: 16, color: "var(--em-2)" }} />
                  <code>agentia.com.py/p/casa-luque?ref=maria</code>
                  <em>612 clics</em>
                </div>
                <div className={styles.lk}>
                  <Icon name="link" style={{ width: 16, height: 16, color: "var(--em-2)" }} />
                  <code>agentia.com.py/p/depto-villa-morra?ref=maria</code>
                  <em>438 clics</em>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.reelRow}>
            <div className={cn(styles.phone, styles.rv, styles.z)}>
              <div className={styles.notch} />
              <div className={styles.reel}>
                <div className={styles.pbar}>
                  <i />
                </div>
                <div className={styles.rl}>
                  <Icon name="home" style={{ width: 18, height: 18, strokeWidth: 2.4 }} />
                  AGENTIA
                </div>
                <div className={styles.shot}>
                  <svg viewBox="0 0 90 190" preserveAspectRatio="xMidYMid slice">
                    <rect width="90" height="190" fill="#bfe3f2" />
                    <rect y="120" width="90" height="70" fill="#7bbf8f" />
                    <path d="M10 130V80l35-25 35 25v50z" fill="#fff" />
                    <rect x="38" y="100" width="14" height="30" fill="#0A8F5C" />
                  </svg>
                </div>
                <div className={styles.shot}>
                  <svg viewBox="0 0 90 190" preserveAspectRatio="xMidYMid slice">
                    <rect width="90" height="190" fill="#e9e2d6" />
                    <rect y="130" width="90" height="60" fill="#b98d62" />
                    <rect x="10" y="100" width="70" height="35" rx="8" fill="#2f6f57" />
                    <circle cx="65" cy="45" r="14" fill="#f4d58d" />
                  </svg>
                </div>
                <div className={styles.shot}>
                  <svg viewBox="0 0 90 190" preserveAspectRatio="xMidYMid slice">
                    <rect width="90" height="190" fill="#dfe8ea" />
                    <rect x="10" y="40" width="70" height="60" fill="#bfe3f2" stroke="#fff" strokeWidth="3" />
                    <rect y="125" width="90" height="65" fill="#cfcfcf" />
                    <rect x="20" y="110" width="50" height="22" rx="4" fill="#fff" />
                  </svg>
                </div>
                <div className={styles.ov}>
                  <small>Casa moderna en Luque</small>
                  <b>USD 185.000</b>
                </div>
              </div>
            </div>
            <div className={cn(styles.rv, styles.r, styles.d2)}>
              <span className={styles.pro}>✦ Plan Pro</span>
              <h2 className={styles.secTitle} style={{ fontSize: "clamp(32px,4vw,48px)", marginTop: 16 }}>
                Reels listos para redes, <span className={styles.em}>generados con IA.</span>
              </h2>
              <p className={styles.secSub}>
                Convertí cualquier propiedad en un video vertical para Instagram, TikTok y WhatsApp. Agentes y
                afiliados tienen contenido listo para compartir.
              </p>
              <div className={styles.list}>
                {reelList.map((item) => (
                  <div key={item}>
                    <Icon name="check" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="planes">
        <div className={styles.wrap}>
          <div style={{ textAlign: "center" }}>
            <div className={cn(styles.eyebrow, styles.rv)}>Planes</div>
            <h2 className={cn(styles.secTitle, styles.rv, styles.d1)} style={{ margin: "0 auto" }}>
              Empezá gratis. <span className={styles.em}>Crecé cuando quieras.</span>
            </h2>
          </div>
          <div className={styles.plans}>
            {PLAN_ORDER.map((planId, i) => {
              const plan = PLANS[planId];
              const isFound = planId === "fundador";
              const isPop = planId === "pro";
              const basicoFeatureSet = new Set(PLANS.basico.features);
              const addedFeatures = plan.features.filter((f) => !basicoFeatureSet.has(f));
              return (
                <div
                  key={plan.id}
                  className={cn(styles.plan, isPop && styles.pop, isFound && styles.found, styles.rv, styles[`d${i + 1}` as "d1" | "d2" | "d3"])}
                >
                  {isPop && <span className={styles.tagx}>Más completo</span>}
                  {isFound && <span className={styles.tagx}>Cupos limitados</span>}
                  <h3 style={isFound ? { display: "flex", gap: 10, alignItems: "center", position: "relative", zIndex: 1 } : undefined}>
                    {isFound && <Icon name="crown" />}
                    {plan.name}
                  </h3>
                  <div className={styles.desc} style={isFound ? { position: "relative", zIndex: 1 } : undefined}>
                    {plan.tagline}
                  </div>
                  <div className={styles.price} style={isFound ? { position: "relative", zIndex: 1 } : undefined}>
                    {plan.price === 0 ? "Gratis" : `Gs. ${plan.price.toLocaleString("es-PY")}`}
                    {plan.price > 0 && <small> /mes</small>}
                  </div>
                  <div className={styles.strike} style={isFound ? { position: "relative", zIndex: 1 } : undefined}>
                    {isFound && `Gs. ${PLANS.pro.price.toLocaleString("es-PY")}`}
                  </div>
                  <ul style={isFound ? { position: "relative", zIndex: 1 } : undefined}>
                    {planId === "basico" &&
                      plan.features.slice(0, 8).map((f) => (
                        <li key={f}>
                          <Icon name="check" />
                          {f}
                        </li>
                      ))}
                    {isPop && (
                      <>
                        <li className={styles.plus}>
                          <Icon name="check" />
                          Todo lo del Básico, más:
                        </li>
                        {addedFeatures.map((f) => (
                          <li key={f}>
                            <Icon name="check" />
                            {f}
                          </li>
                        ))}
                      </>
                    )}
                    {isFound && (
                      <>
                        <li className={styles.plus}>
                          <Icon name="check" />
                          Todo lo del Plan Pro
                        </li>
                        <li>
                          <Icon name="check" />
                          Precio fundador mientras tu suscripción esté activa
                        </li>
                        <li>
                          <Icon name="check" />
                          Solo para los primeros {FUNDADOR_SEAT_LIMIT} agentes
                        </li>
                      </>
                    )}
                  </ul>
                  <Link href="/registro" className={cn(styles.btn, isFound ? undefined : isPop ? styles.pri : styles.sec)}>
                    {planId === "basico" ? "Empezá gratis" : isPop ? "Elegir Pro" : "Quiero mi cupo"}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOUNDER CTA */}
      <section className={styles.final}>
        <div className={styles.ring} />
        <div className={styles.ring} style={{ animationDelay: "2s" }} />
        <div className={styles.ring} style={{ animationDelay: "4s" }} />
        <div className={styles.wrap}>
          <div className={cn(styles.eyebrow, styles.rv)}>Precio fundador</div>
          <h2 className={cn(styles.rv, styles.d1)}>
            Sé uno de los <span className={styles.em}>primeros {FUNDADOR_SEAT_LIMIT}.</span>
          </h2>
          <p className={cn(styles.rv, styles.d2)}>
            Asegurá todas las funciones del Plan Pro a precio reducido, para siempre mientras mantengas tu
            suscripción.
          </p>
          <div className={cn(styles.btns, styles.rv, styles.d3)}>
            <Link href="/registro" className={cn(styles.btn, styles.pri)}>
              Empezá gratis hoy <Icon name="arrow" />
            </Link>
            <a href="#planes" className={cn(styles.btn, styles.sec)}>
              Ver planes
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
