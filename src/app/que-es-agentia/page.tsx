"use client";

import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import styles from "./QueEsAgentia.module.css";

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={cn(styles.ico, className)}>
      <use href={`#i-${name}`} />
    </svg>
  );
}

const roles = [
  {
    icon: "briefcase",
    title: "Agente",
    tag: "Plan mensual",
    items: [
      "Perfil profesional y portafolio",
      "CRM, marketing y chatbot con IA",
      "Una red de afiliados vendiendo por vos",
    ],
    big: "5,5%",
    small: "de comisión por operación",
    star: false,
  },
  {
    icon: "share",
    title: "Afiliado",
    titleNote: "(referido)",
    tag: "Registro sin costo",
    items: ["Elegí cualquier propiedad", "Compartí tu link único", "Cobrá si se vende por tu enlace"],
    big: "1%",
    small: "del valor de la operación",
    star: true,
  },
  {
    icon: "search",
    title: "Comprador",
    tag: "Acceso libre",
    items: ["Más oferta, en un solo lugar", "Información clara de cada propiedad", "Contacto directo con el agente"],
    big: "Sin vueltas",
    small: "atención centralizada y ordenada",
    star: false,
  },
];

const tools = [
  { icon: "db", title: "CRM integrado", text: "Clientes, seguimiento y operaciones ordenadas." },
  { icon: "mega", title: "Marketing digital", text: "Contenido listo para tus redes." },
  { icon: "zap", title: "Automatizaciones", text: "Menos tareas manuales, más tiempo para cerrar." },
  { icon: "bot", title: "Chatbot con IA", text: "Atiende y califica leads por vos." },
];

const wins = [
  { icon: "trend", title: "El agente vende más", text: "Más alcance y más oportunidades, sin depender solo de su propia difusión." },
  { icon: "wallet", title: "El afiliado genera ingresos", text: "Monetiza su red recomendando propiedades." },
  { icon: "users", title: "El comprador encuentra más", text: "Oferta más amplia y una atención más organizada." },
];

const feedEvents = [
  { icon: "msg", title: "Nuevo lead: Carlos R.", text: "Llegó por el link de María", time: "09:47" },
  { icon: "bot", title: "Chatbot calificó al lead", text: "Presupuesto y zona confirmados", time: "09:48" },
  { icon: "db", title: "Guardado en tu CRM", text: "Visita agendada para el sábado", time: "10:02" },
  { icon: "shield", title: "Venta cerrada", text: "Comisiones asignadas: agente 5,5% · afiliado 1%", time: "✓" },
];

export default function QueEsAgentiaPage() {
  useEffect(() => {
    // Scroll reveal
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

    // Activity feed: stagger in
    const feed = document.getElementById("feed");
    let feedObserver: IntersectionObserver | undefined;
    if (feed) {
      feedObserver = new IntersectionObserver(
        (entries, obs) => {
          if (entries[0].isIntersecting) {
            feed.querySelectorAll(`.${styles.ev}`).forEach((ev, i) => setTimeout(() => ev.classList.add(styles.in), i * 450));
            obs.disconnect();
          }
        },
        { threshold: 0.3 }
      );
      feedObserver.observe(feed);
    }

    // Typed affiliate ref
    const code = "maria-24";
    const typedEl = document.getElementById("typed");
    let k = 0;
    const typeInterval = setInterval(() => {
      if (typedEl) typedEl.textContent = code.slice(0, k);
      k = k > code.length + 6 ? 0 : k + 1;
    }, 180);

    // Network diagram
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.getElementById("net");
    let netObserver: IntersectionObserver | undefined;
    if (svg) {
      const C = 300;
      const A = 8;
      const R1 = 150;
      const R2 = 255;
      const el = (name: string, attrs: Record<string, string | number>) => {
        const e = document.createElementNS(NS, name);
        for (const k2 in attrs) e.setAttribute(k2, String(attrs[k2]));
        return e;
      };
      const gLinks = el("g", {});
      const gNodes = el("g", {});
      const gMoving = el("g", {});
      svg.append(gLinks, gMoving, gNodes);
      const affs: Element[] = [];
      const links: Element[] = [];

      // own-network buyers (traditional): a few close dots
      const own: [number, number][] = [];
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        own.push([C + Math.cos(a) * 95, C + Math.sin(a) * 95]);
      }
      own.forEach(([x, y]) => {
        const l = el("path", { d: `M${C},${C}L${x},${y}`, class: "link own" });
        gLinks.append(l);
        gNodes.append(el("circle", { cx: x, cy: y, r: 5, class: "buy own-b", style: "transform:scale(1)" }));
      });

      for (let i = 0; i < A; i++) {
        const a = (i / A) * Math.PI * 2 - Math.PI / 2;
        const x = C + Math.cos(a) * R1;
        const y = C + Math.sin(a) * R1;
        const l = el("path", { d: `M${C},${C}L${x},${y}`, class: "link aff-l" });
        gLinks.append(l);
        links.push(l);
        const n = el("circle", { cx: x, cy: y, r: 15, class: "aff", style: `transition-delay:${0.1 + i * 0.07}s` });
        gNodes.append(n);
        affs.push(n);
        const ic = el("use", {
          href: "#i-share",
          x: x - 8,
          y: y - 8,
          width: 16,
          height: 16,
          class: "ico aff-i",
          style: `color:#13C47F;opacity:0;transition:opacity .4s ${0.3 + i * 0.07}s`,
        });
        gNodes.append(ic);
        for (let j = -1; j <= 1; j++) {
          const b = a + j * 0.19;
          const bx = C + Math.cos(b) * R2;
          const by = C + Math.sin(b) * R2;
          const bl = el("path", { d: `M${x},${y}L${bx},${by}`, class: "link aff-l" });
          gLinks.append(bl);
          links.push(bl);
          gNodes.append(el("circle", { cx: bx, cy: by, r: 5, class: "buy", style: `transition-delay:${0.6 + i * 0.07}s` }));
          // traveling dots
          const dot = el("circle", { r: 3, fill: "#13C47F", class: "mover" });
          const am = el("animateMotion", {
            dur: `${2.2 + Math.random() * 1.5}s`,
            repeatCount: "indefinite",
            begin: `${Math.random() * 2}s`,
            path: `M${C},${C}L${x},${y}L${bx},${by}`,
          });
          dot.append(am);
          gMoving.append(dot);
        }
      }

      // center
      gNodes.append(el("circle", { cx: C, cy: C, r: 38, class: "pulse" }));
      const pulse2 = el("circle", { cx: C, cy: C, r: 38, class: "pulse", style: "animation-delay:1.5s" });
      gNodes.append(pulse2);
      gNodes.append(el("circle", { cx: C, cy: C, r: 38, fill: "#0A8F5C" }));
      gNodes.append(
        el("use", { href: "#i-home", x: C - 17, y: C - 17, width: 34, height: 34, class: "ico", style: "color:#fff;stroke-width:2" })
      );
      const lbl = (x: number, y: number, t: string, c: string) => {
        const e = el("text", { x, y, "text-anchor": "middle", fill: c, "font-size": 13, "font-weight": 600 });
        (e as SVGTextElement).style.fontFamily = "var(--font-inter), sans-serif";
        e.textContent = t;
        gNodes.append(e);
        return e;
      };
      lbl(C, C + 62, "Tu propiedad", "#fff");

      function count(id: string, to: number) {
        const e = document.getElementById(id);
        if (!e) return;
        const from = +(e.textContent || 0);
        const t0 = performance.now();
        const f = (n: number) => {
          const p = Math.min((n - t0) / 700, 1);
          e.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }

      function setMode(m: string) {
        const on = m === "agentia";
        svg!.classList.toggle("go", on);
        svg!.querySelectorAll(".aff-i").forEach((i) => ((i as HTMLElement).style.opacity = on ? "1" : "0"));
        links.forEach((l) => l.classList.toggle("on", on));
        svg!.querySelectorAll(".own").forEach((l) => l.classList.toggle("on", !on));
        svg!.querySelectorAll(".own-b").forEach((b) => ((b as HTMLElement).style.opacity = on ? ".25" : "1"));
        (gMoving as unknown as HTMLElement).style.opacity = on ? "1" : "0";
        document.querySelectorAll(`.${styles.toggle} button`).forEach((b) => b.classList.toggle(styles.act, (b as HTMLElement).dataset.mode === m));
        count("r-b", on ? A : 0);
        count("r-c", on ? A * 3 : 1);
      }

      (gMoving as unknown as HTMLElement).style.transition = "opacity .5s";
      setMode("trad");

      document.querySelectorAll(`.${styles.toggle} button`).forEach((b) => {
        b.addEventListener("click", () => setMode((b as HTMLElement).dataset.mode || "trad"));
      });

      netObserver = new IntersectionObserver(
        (entries, obs) => {
          if (entries[0].isIntersecting) {
            setTimeout(() => setMode("agentia"), 700);
            obs.disconnect();
          }
        },
        { threshold: 0.35 }
      );
      netObserver.observe(svg);
    }

    return () => {
      clearInterval(typeInterval);
      io.disconnect();
      feedObserver?.disconnect();
      netObserver?.disconnect();
    };
  }, []);

  return (
    <div className={styles.page}>
      {/* ICON SPRITE */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <symbol id="i-home" viewBox="0 0 24 24">
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </symbol>
        <symbol id="i-briefcase" viewBox="0 0 24 24">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" />
        </symbol>
        <symbol id="i-share" viewBox="0 0 24 24">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
        </symbol>
        <symbol id="i-search" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </symbol>
        <symbol id="i-check" viewBox="0 0 24 24">
          <path d="M20 6 9 17l-5-5" />
        </symbol>
        <symbol id="i-x" viewBox="0 0 24 24">
          <path d="M18 6 6 18M6 6l12 12" />
        </symbol>
        <symbol id="i-link" viewBox="0 0 24 24">
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
          <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
        </symbol>
        <symbol id="i-cash" viewBox="0 0 24 24">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6 12h.01M18 12h.01" />
        </symbol>
        <symbol id="i-pointer" viewBox="0 0 24 24">
          <path d="m4 4 7 17 2.5-7.5L21 11z" />
        </symbol>
        <symbol id="i-users" viewBox="0 0 24 24">
          <circle cx="9" cy="8" r="4" />
          <path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3" />
        </symbol>
        <symbol id="i-bot" viewBox="0 0 24 24">
          <rect x="4" y="8" width="16" height="12" rx="3" />
          <path d="M12 4v4M9 14h.01M15 14h.01M2 13v3M22 13v3" />
        </symbol>
        <symbol id="i-zap" viewBox="0 0 24 24">
          <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
        </symbol>
        <symbol id="i-mega" viewBox="0 0 24 24">
          <path d="M3 11v3a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1zM17 9a4 4 0 0 1 0 6" />
        </symbol>
        <symbol id="i-db" viewBox="0 0 24 24">
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
        </symbol>
        <symbol id="i-shield" viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </symbol>
        <symbol id="i-msg" viewBox="0 0 24 24">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" />
        </symbol>
        <symbol id="i-eye" viewBox="0 0 24 24">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </symbol>
        <symbol id="i-trend" viewBox="0 0 24 24">
          <path d="m3 17 6-6 4 4 8-8M15 7h6v6" />
        </symbol>
        <symbol id="i-wallet" viewBox="0 0 24 24">
          <path d="M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7" />
          <path d="M16 14h.01" />
        </symbol>
      </svg>

      {/* HERO */}
      <header className={styles.hero}>
        <div className={styles.glow} />
        <div className={styles.dots} />
        <div className={styles.wrap}>
          <h1>
            <span className={styles.word}>¿Qué</span>{" "}
            <span className={styles.word} style={{ animationDelay: ".12s" }}>
              es
            </span>{" "}
            <span className={cn(styles.word, styles.em)} style={{ animationDelay: ".24s" }}>
              Agentia?
            </span>
          </h1>
          <p className={cn(styles.lead, styles.rv, styles.d2)}>
            La plataforma inmobiliaria que convierte cada propiedad en una <b>red de ventas</b>. Agentes, afiliados y
            compradores en un solo ecosistema para <b>vender más rápido</b>.
          </p>
          <div className={cn(styles.trio, styles.rv, styles.d3)}>
            <div className={styles.chip}>
              <Icon name="briefcase" />
              Agentes
            </div>
            <span className={styles.plus}>+</span>
            <div className={cn(styles.chip, styles.hl)}>
              <Icon name="share" />
              Afiliados
            </div>
            <span className={styles.plus}>+</span>
            <div className={styles.chip}>
              <Icon name="search" />
              Compradores
            </div>
          </div>
        </div>
      </header>

      {/* ROLES */}
      <section>
        <div className={styles.wrap}>
          <div className={cn(styles.eyebrow, styles.rv)}>Un ecosistema, tres roles</div>
          <h2 className={cn(styles.secTitle, styles.rv, styles.d1)}>Todos ganan cuando una propiedad se vende.</h2>
          <div className={styles.roles}>
            {roles.map((role, i) => (
              <article
                key={role.title}
                className={cn(styles.card, role.star && styles.star, styles.rv, styles[`d${i + 1}` as "d1" | "d2" | "d3"])}
              >
                {role.star && <span className={styles.ribbon}>Gratis</span>}
                <div className={styles.badgeIco}>
                  <Icon name={role.icon} />
                </div>
                <h3>
                  {role.title}
                  {role.titleNote && (
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 15, fontWeight: 500, letterSpacing: 0, opacity: 0.85 }}>
                      {" "}
                      {role.titleNote}
                    </span>
                  )}
                </h3>
                <div className={styles.tag}>{role.tag}</div>
                <ul>
                  {role.items.map((item) => (
                    <li key={item}>
                      <Icon name="check" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className={styles.big} style={role.title === "Comprador" ? { fontSize: 40 } : undefined}>
                  {role.big}
                  <small>{role.small}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* NETWORK */}
      <section className={styles.netSec}>
        <div className={styles.dots} />
        <div className={cn(styles.wrap, styles.netGrid)}>
          <div>
            <div className={cn(styles.eyebrow, styles.rv)}>La red de afiliados</div>
            <h2 className={cn(styles.secTitle, styles.rv, styles.d1)}>
              Una propiedad. <span className={styles.em}>Cientos de vendedores.</span>
            </h2>
            <p className={cn(styles.secSub, styles.rv, styles.d2)}>
              En un portal tradicional, tu propiedad depende de tu propio alcance. En Agentia, cualquier persona
              puede promocionarla con su link y cobrar si se vende. Tu publicación deja de esperar y empieza a
              moverse.
            </p>
            <div className={cn(styles.toggle, styles.rv, styles.d3)} role="tablist">
              <button type="button" data-mode="trad">
                Portal tradicional
              </button>
              <button type="button" data-mode="agentia" className={styles.act}>
                Con Agentia
              </button>
            </div>
            <div className={cn(styles.reach, styles.rv, styles.d3)}>
              <div>
                <b id="r-a">1</b>
                <span>agente</span>
              </div>
              <div className={styles.emB}>
                <b id="r-b">0</b>
                <span>afiliados difundiendo</span>
              </div>
              <div className={styles.emB}>
                <b id="r-c">0</b>
                <span>canales activos</span>
              </div>
            </div>
          </div>
          <svg className={styles.netSvg} id="net" viewBox="0 0 600 600" aria-label="Diagrama de la red de afiliados" />
        </div>
      </section>

      {/* HOW AFFILIATE WORKS */}
      <section>
        <div className={styles.wrap}>
          <div className={cn(styles.eyebrow, styles.rv)}>Cómo funciona para el afiliado</div>
          <h2 className={cn(styles.secTitle, styles.rv, styles.d1)}>
            Recomendá propiedades. <span className={styles.em}>Ganá comisiones.</span>
          </h2>
          <p className={cn(styles.secSub, styles.rv, styles.d2)}>
            Sin licencia, sin inversión, sin cartera propia. Solo tu red de contactos.
          </p>
          <div className={styles.steps}>
            <div className={cn(styles.step, styles.rv, styles.d1)}>
              <div className={styles.n}>01</div>
              <h3>
                <Icon name="pointer" />
                Elegí
              </h3>
              <p>Cualquier propiedad publicada en la plataforma.</p>
              <div className={styles.linkbox}>
                agentia.com.py/ref/<span id="typed" />
                <span className={styles.caret} />
              </div>
            </div>
            <div className={cn(styles.step, styles.rv, styles.d2)}>
              <div className={styles.n}>02</div>
              <h3>
                <Icon name="link" />
                Compartí
              </h3>
              <p>Tu link único, por donde quieras.</p>
              <div className={styles.channels}>
                <span>WhatsApp</span>
                <span>Instagram</span>
                <span>Facebook</span>
                <span>TikTok</span>
                <span>Tus contactos</span>
              </div>
            </div>
            <div className={cn(styles.step, styles.rv, styles.d3)}>
              <div className={styles.n}>03</div>
              <h3>
                <Icon name="cash" />
                Cobrá
              </h3>
              <p>Cuando la venta se concreta por tu enlace.</p>
              <div className={styles.money}>
                1%
                <small>del valor de la operación, registrado a tu nombre</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section style={{ paddingTop: 40 }}>
        <div className={styles.wrap}>
          <div className={cn(styles.eyebrow, styles.rv)}>Por qué es distinto</div>
          <h2 className={cn(styles.secTitle, styles.rv, styles.d1)}>
            Los portales publican. <span className={styles.em}>Agentia vende.</span>
          </h2>
          <div className={styles.cmp}>
            <div className={cn(styles.col, styles.rv, styles.d1)}>
              <h3>
                <Icon name="eye" />
                Portales tradicionales
              </h3>
              <div className={styles.row}>
                <div className={cn(styles.mark, styles.x)}>
                  <Icon name="x" />
                </div>
                <div>
                  <b>Publicar y esperar</b>
                  <span>La propiedad queda en una vitrina hasta que alguien la encuentre.</span>
                </div>
              </div>
              <div className={styles.row}>
                <div className={cn(styles.mark, styles.x)}>
                  <Icon name="x" />
                </div>
                <div>
                  <b>Alcance limitado</b>
                  <span>Depende del tráfico del portal y de la difusión del agente.</span>
                </div>
              </div>
              <div className={styles.row}>
                <div className={cn(styles.mark, styles.x)}>
                  <Icon name="x" />
                </div>
                <div>
                  <b>Solo un aviso</b>
                  <span>Sin CRM, sin seguimiento, sin automatización.</span>
                </div>
              </div>
              <div className={styles.row}>
                <div className={cn(styles.mark, styles.x)}>
                  <Icon name="x" />
                </div>
                <div>
                  <b>Contactos dispersos</b>
                  <span>Consultas que se pierden entre llamadas y chats.</span>
                </div>
              </div>
            </div>
            <div className={cn(styles.col, styles.us, styles.rv, styles.d2)}>
              <h3>
                <Icon name="zap" className={styles.em} />
                Agentia
              </h3>
              <div className={styles.row}>
                <div className={cn(styles.mark, styles.v)}>
                  <Icon name="check" />
                </div>
                <div>
                  <b>Venta activa</b>
                  <span>Una red de afiliados sale a buscar compradores.</span>
                </div>
              </div>
              <div className={styles.row}>
                <div className={cn(styles.mark, styles.v)}>
                  <Icon name="check" />
                </div>
                <div>
                  <b>Alcance multiplicado</b>
                  <span>Cada afiliado suma sus redes, grupos y contactos.</span>
                </div>
              </div>
              <div className={styles.row}>
                <div className={cn(styles.mark, styles.v)}>
                  <Icon name="check" />
                </div>
                <div>
                  <b>Herramientas completas</b>
                  <span>CRM, marketing digital, automatizaciones y chatbot con IA.</span>
                </div>
              </div>
              <div className={styles.row}>
                <div className={cn(styles.mark, styles.v)}>
                  <Icon name="check" />
                </div>
                <div>
                  <b>Todo registrado</b>
                  <span>Cada contacto y oportunidad queda en el CRM del agente.</span>
                </div>
              </div>
              <div className={styles.row}>
                <div className={cn(styles.mark, styles.v)}>
                  <Icon name="check" />
                </div>
                <div>
                  <b>Servicios con I.A.</b>
                  <span>
                    Mejorá la calidad de tus fotos, generá imágenes y videos listos para redes, contratos digitales y
                    agendamientos automáticos.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section style={{ paddingTop: 40 }}>
        <div className={styles.wrap}>
          <div className={cn(styles.eyebrow, styles.rv)}>Para el agente</div>
          <h2 className={cn(styles.secTitle, styles.rv, styles.d1)}>
            Todo lo que necesitás para vender, en un solo lugar.
          </h2>
          <div className={styles.tools}>
            {tools.map((tool, i) => (
              <div key={tool.title} className={cn(styles.tool, styles.rv, styles[`d${i + 1}` as "d1" | "d2" | "d3" | "d4"])}>
                <Icon name={tool.icon} />
                <h4>{tool.title}</h4>
                <p>{tool.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section>
        <div className={cn(styles.wrap, styles.trust)}>
          <div>
            <div className={cn(styles.eyebrow, styles.rv)}>Confianza y transparencia</div>
            <h2 className={cn(styles.secTitle, styles.rv, styles.d1)}>Nada se pierde en el camino.</h2>
            <p className={cn(styles.secSub, styles.rv, styles.d2)}>
              La comunicación entre comprador, agente y afiliado queda centralizada y registrada. El agente mantiene
              el control de sus clientes y cada afiliado tiene su venta respaldada.
            </p>
          </div>
          <div className={styles.feed} id="feed">
            {feedEvents.map((ev) => (
              <div key={ev.title} className={styles.ev}>
                <div className={styles.dot}>
                  <Icon name={ev.icon} />
                </div>
                <div>
                  <b>{ev.title}</b>
                  <span>{ev.text}</span>
                </div>
                <time>{ev.time}</time>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WIN */}
      <section style={{ paddingTop: 30 }}>
        <div className={styles.wrap}>
          <div className={cn(styles.eyebrow, styles.rv)}>El resultado</div>
          <h2 className={cn(styles.secTitle, styles.rv, styles.d1)}>Un modelo donde todos ganan.</h2>
          <div className={styles.win}>
            {wins.map((win, i) => (
              <div key={win.title} className={cn(styles.card, styles.rv, styles[`d${i + 1}` as "d1" | "d2" | "d3"])}>
                <div className={styles.badgeIco}>
                  <Icon name={win.icon} />
                </div>
                <h3>{win.title}</h3>
                <p>{win.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.dots} />
        <div className={styles.wrap} style={{ position: "relative" }}>
          <div className={cn(styles.eyebrow, styles.rv)}>La nueva infraestructura inmobiliaria del Paraguay</div>
          <h2 className={cn(styles.rv, styles.d1)}>
            Ventas colaborativas, marketing, CRM e IA. <span className={styles.em}>En una sola plataforma.</span>
          </h2>
          <p className={cn(styles.rv, styles.d2)}>Vendé más rápido. Llegá más lejos. Conectá mejor.</p>
          <div className={cn(styles.btns, styles.rv, styles.d3)}>
            <Link href="/registro/agente" className={cn(styles.btn, styles.pri)}>
              Soy agente
              <Icon name="arrow" />
            </Link>
            <Link href="/registro/usuario" className={cn(styles.btn, styles.sec)}>
              Quiero ser afiliado
              <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
