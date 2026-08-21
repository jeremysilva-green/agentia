"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Printer } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ViewAcuerdoButton } from "@/components/panel/ViewAcuerdoButton";
import { DeleteAcuerdoButton } from "@/components/panel/DeleteAcuerdoButton";
import type { PrivateAgreement } from "@/types/domain";

// The raw `status` column alone can't tell a brand-new draft (agent hasn't
// saved anything yet) apart from one the agent has actually reviewed and
// signed — both sit at "pending_owner" until the owner completes their
// part. Signed timestamps are the real source of truth for the display.
function getDisplayStatus(agreement: PrivateAgreement): {
  label: string;
  className: string;
} {
  if (!agreement.agent_signed_at) {
    return { label: "Borrador", className: "border-sky-500/40! bg-sky-500/15! text-sky-300!" };
  }
  if (!agreement.owner_signed_at) {
    return { label: "Pendiente del propietario", className: "border-red-500/40! bg-red-500/15! text-red-300!" };
  }
  return { label: "Completado", className: "border-emerald-500/40! bg-emerald-500/15! text-emerald-300!" };
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
      className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-white/5 px-2 py-1 text-[11px] font-medium text-white/80 hover:bg-white/10"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "¡Copiado!" : "Copiar enlace"}
    </button>
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
    return openAgreement ? monthKey(openAgreement.created_at) : null;
  }, [agreements, autoOpenId]);

  const [expandedMonth, setExpandedMonth] = useState<string | null>(defaultMonth);

  useEffect(() => {
    if (autoOpenId) router.replace("/panel/acuerdos");
    // Only ever meant to fire once, right after the redirect from "Nuevo Acuerdo" — not on every autoOpenId identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (agreements.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Todavía no generaste ningún Acuerdo Privado.
      </div>
    );
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
                  ? "self-start rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                  : "self-start rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/15 hover:text-white"
              }
            >
              {m.label} ({m.items.length})
            </button>

            {isExpanded && (
              <div className="flex flex-col gap-3">
                {m.items.map((agreement) => {
                  const displayStatus = getDisplayStatus(agreement);
                  return (
                    <div
                      key={agreement.id}
                      className="flex flex-col gap-2 rounded-2xl border border-emerald-500/40 bg-neutral-900 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-white">{agreement.owner1_name || "Propietario sin completar"}</p>
                          <Badge className={displayStatus.className}>{displayStatus.label}</Badge>
                        </div>
                        <p className="text-xs text-slate-400">
                          {agreement.property_city || "Ciudad sin definir"} · Generado el {dateFmt(agreement.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <CopyLinkButton shareCode={agreement.share_code} />
                        <a
                          href={`/imprimir-acuerdo/${agreement.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-white/5 px-2 py-1 text-[11px] font-medium text-white/80 hover:bg-white/10"
                        >
                          <Printer size={12} />
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
