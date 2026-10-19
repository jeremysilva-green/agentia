"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Printer, Calendar, ChevronDown, FileSignature, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { PanelBadge } from "@/components/panel/theme/PanelBadge";
import { EmptyState } from "@/components/panel/theme/EmptyState";
import { ViewAcuerdoButton } from "@/components/panel/ViewAcuerdoButton";
import { DeleteAcuerdoButton } from "@/components/panel/DeleteAcuerdoButton";
import type { PrivateAgreement } from "@/types/domain";

// The raw `status` column alone can't tell a brand-new draft (agent hasn't
// saved anything yet) apart from one the agent has actually reviewed and
// signed — both sit at "pending_owner" until the owner completes their
// part. Signed timestamps are the real source of truth for the display.
function getDisplayStatus(agreement: PrivateAgreement): {
  label: string;
  tone: "blue" | "amber" | "emerald";
  step: 1 | 2 | 3;
} {
  if (!agreement.agent_signed_at) return { label: "Borrador", tone: "blue", step: 2 };
  if (!agreement.owner_signed_at) return { label: "Pendiente del propietario", tone: "amber", step: 2 };
  return { label: "Completado", tone: "emerald", step: 3 };
}

const dateFmt = (value: string) =>
  new Date(value).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" });

function monthKey(value: string) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(value: string) {
  const label = new Date(value).toLocaleDateString("es-PY", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function CopyLinkButton({ shareCode }: { shareCode: string }) {
  const [copied, setCopied] = useState(false);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const shareUrl = `${siteUrl}/acuerdo/${shareCode}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "¡Copiado!" : "Copiar enlace para el propietario"}
      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white/[0.04] px-3.5 text-[13.5px] font-semibold whitespace-nowrap text-[#d5d5d5] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "¡Copiado!" : "Copiar enlace"}
    </button>
  );
}

function StepTracker({ step }: { step: 1 | 2 | 3 }) {
  const steps: { n: 1 | 2 | 3; label: string }[] = [
    { n: 1, label: "Generado" },
    { n: 2, label: "Completa el propietario" },
    { n: 3, label: "Firmado" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4">
      {steps.map(({ n, label }) => {
        const done = n < step;
        const current = n === step;
        return (
          <div key={n} className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-2.5 sm:text-left">
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[12px] font-semibold",
                done
                  ? "border-[var(--em)] bg-[var(--em)] text-white"
                  : current
                    ? "panel-pulse-dot-ring border-[var(--em-2)] text-[var(--em-2)]"
                    : "border-[#333] bg-[var(--ink)] text-[var(--muted)]"
              )}
            >
              {done ? <Check size={14} /> : n}
            </span>
            <span className={cn("text-[11px] leading-tight sm:text-[13px]", done || current ? "text-[#e6e6e6]" : "text-[var(--muted)]")}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AcuerdosList({ agreements, autoOpenId }: { agreements: PrivateAgreement[]; autoOpenId?: string }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(autoOpenId ?? null);

  const months = useMemo(() => {
    const map = new Map<string, { label: string; items: PrivateAgreement[] }>();
    for (const agreement of agreements) {
      const key = monthKey(agreement.created_at);
      if (!map.has(key)) map.set(key, { label: monthLabel(agreement.created_at), items: [] });
      map.get(key)!.items.push(agreement);
    }
    return Array.from(map.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [agreements]);

  // Collapsed by default — only auto-expand the relevant month when we just
  // redirected here from "Nuevo Acuerdo" and need to show that agreement.
  const defaultMonth = useMemo(() => {
    const openAgreement = autoOpenId ? agreements.find((a) => a.id === autoOpenId) : undefined;
    return openAgreement ? monthKey(openAgreement.created_at) : (months[0]?.key ?? null);
  }, [agreements, autoOpenId, months]);

  const [expandedMonth, setExpandedMonth] = useState<string | null>(defaultMonth);

  useEffect(() => {
    if (autoOpenId) router.replace("/panel/acuerdos");
    // Only ever meant to fire once, right after the redirect from "Nuevo Acuerdo" — not on every autoOpenId identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (agreements.length === 0) {
    return <EmptyState message="Todavía no generaste ningún Acuerdo Privado." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {months.map((m) => {
        const isExpanded = expandedMonth === m.key;
        return (
          <div key={m.key} className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setExpandedMonth(isExpanded ? null : m.key)}
              className={
                isExpanded
                  ? "inline-flex w-fit items-center gap-2 self-start rounded-full border border-[var(--em-2)] bg-[var(--ink-2)] px-3.5 py-2 text-[13.5px] font-semibold text-[var(--em-2)]"
                  : "inline-flex w-fit items-center gap-2 self-start rounded-full border border-[#13c47f44] bg-[var(--ink-2)] px-3.5 py-2 text-[13.5px] font-semibold text-[var(--em-2)]/80 hover:border-[#13c47f88] hover:text-[var(--em-2)]"
              }
            >
              <Calendar size={15} />
              {m.label}
              <span className="grid min-w-[22px] place-items-center rounded-full bg-[var(--em)] px-1.5 py-0.5 text-[11px] text-white">
                {m.items.length}
              </span>
              <ChevronDown size={14} className={cn("transition-transform", isExpanded && "rotate-180")} />
            </button>

            {isExpanded && (
              <div className="flex flex-col gap-3">
                {m.items.map((agreement) => {
                  const displayStatus = getDisplayStatus(agreement);
                  return (
                    <div key={agreement.id} className="flex flex-col gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--ink-2)] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <span className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-2xl border border-white/10 bg-[var(--ink)] text-[var(--em-2)]">
                            <FileSignature size={20} />
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-white">{agreement.owner1_name || "Propietario sin completar"}</p>
                              <PanelBadge tone={displayStatus.tone}>{displayStatus.label}</PanelBadge>
                            </div>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                              <MapPin size={12} className={agreement.property_city ? "text-[var(--em-2)]" : "text-amber-400"} />
                              <span className={agreement.property_city ? undefined : "text-amber-400"}>
                                {agreement.property_city || "Ciudad sin definir"}
                              </span>
                              <span className="h-[3px] w-[3px] rounded-full bg-[#555]" />
                              Generado el {dateFmt(agreement.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                          <CopyLinkButton shareCode={agreement.share_code} />
                          <a
                            href={`/imprimir-acuerdo/${agreement.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white/[0.04] px-3.5 text-[13.5px] font-semibold text-[#d5d5d5] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
                          >
                            <Printer size={14} />
                            Imprimir
                          </a>
                          <ViewAcuerdoButton
                            agreement={agreement}
                            open={openId === agreement.id}
                            onOpenChange={(isOpen) => setOpenId(isOpen ? agreement.id : null)}
                          />
                          <DeleteAcuerdoButton agreementId={agreement.id} />
                        </div>
                      </div>

                      <StepTracker step={displayStatus.step} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
