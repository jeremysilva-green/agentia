"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { PLANS, PLAN_ORDER, FUNDADOR_SEAT_LIMIT, BASICO_CARD_FEATURES } from "@/lib/plans";
import styles from "@/app/HomePage.module.css";

function Icon({ name, className, style }: { name: string; className?: string; style?: CSSProperties }) {
  return (
    <svg className={cn(styles.ico, className)} style={style}>
      <use href={`#i-${name}`} />
    </svg>
  );
}

// The pricing section of the landing page, shared so the public /planes page
// shows exactly the same cards. Renders its own icon sprite and scroll-reveal
// so it works standalone; on the landing page the extra observer is harmless.
export function PlansSection({ standalone = false }: { standalone?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
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
    root.querySelectorAll(`.${styles.rv}`).forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const content = (
    <div ref={rootRef}>
      {standalone && (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></symbol>
          <symbol id="i-crown" viewBox="0 0 24 24"><path d="M3 18h18M4 7l4 4 4-6 4 6 4-4-2 11H6z" /></symbol>
          <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></symbol>
        </svg>
      )}
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
              const isMls = planId === "mls";
              const basicoFeatureSet = new Set(PLANS.basico.features);
              const addedFeatures = plan.features.filter((f) => !basicoFeatureSet.has(f));
              return (
                <div
                  key={plan.id}
                  className={cn(
                    styles.plan,
                    isPop && styles.pop,
                    isFound && styles.found,
                    isMls && styles.mlsPlan,
                    styles.rv,
                    styles[`d${i + 1}` as "d1" | "d2" | "d3"]
                  )}
                >
                  {isPop && <span className={styles.tagx}>Más completo</span>}
                  {isFound && <span className={styles.tagx}>Cupos limitados</span>}
                  {isMls && <span className={styles.tagx}>Premium</span>}
                  <h3 style={isFound || isMls ? { display: "flex", gap: 10, alignItems: "center", position: "relative", zIndex: 1 } : undefined}>
                    {isFound && <Icon name="crown" />}
                    {isMls && <Icon name="globe" style={{ color: "#a78bfa" }} />}
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
                      BASICO_CARD_FEATURES.map((f) => (
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
                  <Link href="/registro" className={cn(styles.btn, isFound || isMls ? undefined : isPop ? styles.pri : styles.sec)}>
                    {planId === "basico" ? "Empezá gratis" : isPop ? "Elegir Pro" : isMls ? "Elegir Plan" : "Quiero mi cupo"}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );

  return standalone ? <div className={styles.page}>{content}</div> : content;
}
