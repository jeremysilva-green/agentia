"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Globe, X, Paperclip, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PanelButton } from "@/components/panel/theme/PanelButton";
import { cn } from "@/lib/cn";

const darkInputClass =
  "bg-black/30! border-[var(--line)]! text-white! placeholder:text-[var(--muted)]! focus:border-[var(--em)]! focus:ring-[var(--em)]/20!";
const darkLabelClass = "text-[13px] font-medium text-[#cfcfcf]";
const darkTextareaClass =
  "rounded-xl border border-[var(--line)] bg-black/30 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--em)] focus:ring-2 focus:ring-[var(--em)]/20";

function AuthorizationTypeToggle({
  value,
  onChange,
}: {
  value: "exclusiva" | "no_exclusiva";
  onChange: (value: "exclusiva" | "no_exclusiva") => void;
}) {
  const options: { value: "exclusiva" | "no_exclusiva"; label: string }[] = [
    { value: "exclusiva", label: "Exclusiva" },
    { value: "no_exclusiva", label: "No exclusiva" },
  ];

  return (
    <div className="inline-flex w-fit shrink-0 items-center rounded-lg border border-[var(--line)] bg-black/30 p-0.5 text-xs font-medium">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded px-2.5 py-1.5 transition-colors",
            value === option.value ? "bg-[var(--em)] text-white" : "text-[var(--muted)] hover:text-white"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function AddToMlsModal({
  propertyId,
  propertyAddress,
  propertyCurrency,
}: {
  propertyId: string;
  propertyAddress: string | null;
  propertyCurrency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authorizationType, setAuthorizationType] = useState<"exclusiva" | "no_exclusiva">("exclusiva");
  const [signedAt, setSignedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [cobrokePercent, setCobrokePercent] = useState("50");
  const [ownerMinPrice, setOwnerMinPrice] = useState("");
  const [ownerMinPriceWithIva, setOwnerMinPriceWithIva] = useState(false);
  const [exactAddress, setExactAddress] = useState(propertyAddress ?? "");
  const [showingInstructions, setShowingInstructions] = useState("");
  const [documentationStatus, setDocumentationStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{ agentName: string; propertyTitle: string } | null>(null);

  function close() {
    setOpen(false);
    setError(null);
    setDuplicateWarning(null);
  }

  function toggleOwnerMinPriceIva(checked: boolean) {
    setOwnerMinPriceWithIva(checked);
    setOwnerMinPrice((prev) => {
      const num = Number(prev) || 0;
      if (num === 0) return prev;
      const next = checked ? num * 1.1 : num / 1.1;
      return String(Math.round(next));
    });
  }

  function submit(confirmDuplicate: boolean) {
    if (!file) {
      setError("Adjuntá la autorización de venta firmada.");
      return;
    }
    setError(null);
    setDuplicateWarning(null);

    const formData = new FormData();
    formData.set("propertyId", propertyId);
    formData.set("authorizationType", authorizationType);
    formData.set("authorizationSignedAt", signedAt);
    formData.set("authorizationExpiresAt", expiresAt);
    formData.set("cobrokePercent", cobrokePercent);
    formData.set("ownerMinPrice", ownerMinPrice);
    formData.set("exactAddress", exactAddress);
    formData.set("showingInstructions", showingInstructions);
    formData.set("documentationStatus", documentationStatus);
    formData.set("notes", notes);
    formData.set("authorizationFile", file);
    if (confirmDuplicate) formData.set("confirmDuplicate", "true");

    startTransition(async () => {
      const res = await fetch("/api/mls/listings", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.requiresDuplicateConfirmation) {
          setDuplicateWarning({ agentName: data.duplicateAgentName, propertyTitle: data.duplicatePropertyTitle });
        } else {
          setError(data.error ?? "No se pudo agregar la propiedad al MLS.");
        }
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(false);
  }

  return (
    <>
      <PanelButton type="button" variant="outline" className="h-10! w-full text-[13.5px]!" onClick={() => setOpen(true)}>
        <Globe size={14} />
        Agregar al MLS
      </PanelButton>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={close}
            style={
              {
                // Portaled to <body>, outside .panel-dark's subtree — redeclare
                // its theme tokens locally so var(--ink-2) etc. below still
                // resolve instead of silently falling through to transparent.
                "--ink": "#0e0e0e",
                "--ink-2": "#151515",
                "--ink-3": "#1c1c1c",
                "--line": "#262626",
                "--em": "#0a8f5c",
                "--em-2": "#13c47f",
                "--em-glow": "rgba(19, 196, 127, 0.32)",
                "--muted": "#9a9a9a",
                "--text": "#ededed",
              } as React.CSSProperties
            }
          >
            <div
              className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink-2)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] bg-gradient-to-b from-[#0A8F5C1a] to-transparent p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#13c47f33] bg-[#13c47f17] text-[var(--em-2)]">
                    <Globe size={16} />
                  </span>
                  <h2 className="font-display text-base font-semibold text-white">Agregar al MLS</h2>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="shrink-0 rounded-lg border border-[var(--line)] p-2 text-[var(--muted)] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto p-5">
                <div className="flex flex-col gap-1.5">
                  <label className={darkLabelClass}>Autorización de venta firmada (PDF o imagen)</label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <label
                      htmlFor="authorizationFile"
                      className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white/[0.04] px-3.5 text-[13.5px] font-semibold text-[#d5d5d5] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
                    >
                      <Paperclip size={14} />
                      Elegir archivo
                    </label>
                    <input
                      id="authorizationFile"
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="sr-only"
                    />
                    <span className="min-w-0 truncate text-[12.5px] text-[var(--muted)]">
                      {file ? file.name : "Ningún archivo seleccionado"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={darkLabelClass}>Tipo de autorización</label>
                  <AuthorizationTypeToggle value={authorizationType} onChange={setAuthorizationType} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="signedAt"
                    label="Fecha de firma"
                    labelClassName={darkLabelClass}
                    type="date"
                    value={signedAt}
                    onChange={(e) => setSignedAt(e.target.value)}
                    required
                    className={darkInputClass}
                    style={{ colorScheme: "dark" }}
                  />
                  <Input
                    id="expiresAt"
                    label="Vencimiento (opcional)"
                    labelClassName={darkLabelClass}
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className={darkInputClass}
                    style={{ colorScheme: "dark" }}
                  />
                </div>

                <Input
                  id="cobrokePercent"
                  label="Tu oferta de cooperación (% de tu comisión, mínimo 50%)"
                  labelClassName={darkLabelClass}
                  type="number"
                  min="50"
                  max="100"
                  step="0.01"
                  value={cobrokePercent}
                  onChange={(e) => setCobrokePercent(e.target.value)}
                  required
                  className={darkInputClass}
                />

                <div className="rounded-xl border border-[var(--line)] bg-black/20 p-4">
                  <p className="mb-3 text-[11px] font-bold tracking-wide text-[var(--muted)] uppercase">
                    Información privada — solo miembros del MLS
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label htmlFor="ownerMinPrice" className={darkLabelClass}>
                          Precio mínimo del propietario (opcional)
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted)]">
                            <input
                              type="checkbox"
                              checked={ownerMinPriceWithIva}
                              onChange={(e) => toggleOwnerMinPriceIva(e.target.checked)}
                              className="h-3.5 w-3.5 rounded border-[var(--line)] bg-black/30 text-[var(--em)] accent-[var(--em)] focus:ring-[var(--em)]"
                            />
                            IVA (10%)
                          </label>
                          <span className="inline-flex h-6 shrink-0 items-center rounded-lg border border-[var(--line)] bg-black/30 px-2.5 text-[11px] font-semibold text-[var(--em-2)]">
                            {propertyCurrency}
                          </span>
                        </div>
                      </div>
                      <Input
                        id="ownerMinPrice"
                        type="number"
                        min="0"
                        value={ownerMinPrice}
                        onChange={(e) => setOwnerMinPrice(e.target.value)}
                        placeholder="sin puntos ni comas"
                        className={darkInputClass}
                      />
                    </div>
                    <Input
                      id="exactAddress"
                      label="Dirección exacta"
                      labelClassName={darkLabelClass}
                      value={exactAddress}
                      onChange={(e) => setExactAddress(e.target.value)}
                      className={darkInputClass}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className={darkLabelClass}>Instrucciones para visitas</label>
                      <textarea
                        value={showingInstructions}
                        onChange={(e) => setShowingInstructions(e.target.value)}
                        rows={2}
                        className={darkTextareaClass}
                      />
                    </div>
                    <Input
                      id="documentationStatus"
                      label="Estado de la documentación"
                      labelClassName={darkLabelClass}
                      placeholder="Ej: título al día, impuesto inmobiliario al día"
                      value={documentationStatus}
                      onChange={(e) => setDocumentationStatus(e.target.value)}
                      className={darkInputClass}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className={darkLabelClass}>Notas privadas</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className={darkTextareaClass}
                      />
                    </div>
                  </div>
                </div>

                {duplicateWarning ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                      <p className="text-[13px] text-amber-100">
                        Ya hay una propiedad cargada en el MLS en esta dirección, a nombre de{" "}
                        <b className="font-semibold text-white">{duplicateWarning.agentName}</b> (
                        {duplicateWarning.propertyTitle}). Si es un inmueble distinto — por ejemplo, otra unidad del
                        mismo edificio — podés continuar igual.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => submit(true)}
                        disabled={isPending}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 text-[13px] font-semibold text-black transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isPending ? "Agregando..." : "Sí, es otra propiedad — continuar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuplicateWarning(null)}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--line)] px-3.5 text-[13px] font-semibold text-[#cfcfcf] transition-colors hover:border-[var(--em)] hover:text-[var(--em-2)]"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  error && <p className="text-sm text-[#ff8a8a]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--em)] font-display text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_var(--em-glow)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--em-2)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <Globe size={16} />
                  {isPending ? "Agregando..." : "Agregar al MLS"}
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
