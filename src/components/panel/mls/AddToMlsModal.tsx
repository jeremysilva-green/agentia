"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PillTabs } from "@/components/ui/PillTabs";

export function AddToMlsModal({ propertyId, propertyAddress }: { propertyId: string; propertyAddress: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authorizationType, setAuthorizationType] = useState<"exclusiva" | "no_exclusiva">("exclusiva");
  const [signedAt, setSignedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [cobrokePercent, setCobrokePercent] = useState("50");
  const [ownerMinPrice, setOwnerMinPrice] = useState("");
  const [exactAddress, setExactAddress] = useState(propertyAddress ?? "");
  const [showingInstructions, setShowingInstructions] = useState("");
  const [documentationStatus, setDocumentationStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Adjuntá la autorización de venta firmada.");
      return;
    }
    setError(null);

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

    startTransition(async () => {
      const res = await fetch("/api/mls/listings", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo agregar la propiedad al MLS.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Globe size={14} />
        Agregar al MLS
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={close}>
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-base font-semibold text-slate-900">Agregar al MLS</h2>
              <button type="button" onClick={close} className="text-slate-400 transition-colors hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto p-5">
              <div>
                <label className="text-sm font-medium text-slate-700">Autorización de venta firmada (PDF o imagen)</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Tipo de autorización</label>
                <PillTabs
                  options={[
                    { value: "exclusiva", label: "Exclusiva" },
                    { value: "no_exclusiva", label: "No exclusiva" },
                  ]}
                  value={authorizationType}
                  onChange={(v) => setAuthorizationType(v as "exclusiva" | "no_exclusiva")}
                  className="self-start"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="signedAt"
                  label="Fecha de firma"
                  type="date"
                  value={signedAt}
                  onChange={(e) => setSignedAt(e.target.value)}
                  required
                />
                <Input
                  id="expiresAt"
                  label="Vencimiento (opcional)"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <Input
                id="cobrokePercent"
                label="Tu oferta de cooperación (% de tu comisión, mínimo 50%)"
                type="number"
                min="50"
                max="100"
                step="0.01"
                value={cobrokePercent}
                onChange={(e) => setCobrokePercent(e.target.value)}
                required
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Información privada — solo miembros del MLS
                </p>
                <div className="flex flex-col gap-3">
                  <Input
                    id="ownerMinPrice"
                    label="Precio mínimo del propietario (opcional)"
                    type="number"
                    min="0"
                    value={ownerMinPrice}
                    onChange={(e) => setOwnerMinPrice(e.target.value)}
                    className="bg-white!"
                  />
                  <Input
                    id="exactAddress"
                    label="Dirección exacta"
                    value={exactAddress}
                    onChange={(e) => setExactAddress(e.target.value)}
                    className="bg-white!"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Instrucciones para visitas</label>
                    <textarea
                      value={showingInstructions}
                      onChange={(e) => setShowingInstructions(e.target.value)}
                      rows={2}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-prussian outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
                    />
                  </div>
                  <Input
                    id="documentationStatus"
                    label="Estado de la documentación"
                    placeholder="Ej: título al día, impuesto inmobiliario al día"
                    value={documentationStatus}
                    onChange={(e) => setDocumentationStatus(e.target.value)}
                    className="bg-white!"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Notas privadas</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-prussian outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" size="md" className="w-full" disabled={isPending}>
                {isPending ? "Agregando..." : "Agregar al MLS"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
