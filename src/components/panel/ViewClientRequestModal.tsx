"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/lib/constants/propertyTypes";
import { CLIENT_REQUEST_STATUS_LABELS } from "@/lib/constants/clientRequests";
import { copy } from "@/lib/copy";
import type { ClientRequest } from "@/types/domain";

const statusTone = { pending: "neutral", approved: "success", rejected: "danger" } as const;

function priceRange(row: ClientRequest) {
  return row.price_min != null && row.price_max != null
    ? `Gs. ${Number(row.price_min).toLocaleString("es-PY")} - ${Number(row.price_max).toLocaleString("es-PY")}`
    : "—";
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}

export function ViewClientRequestModal({ row }: { row: ClientRequest }) {
  const [open, setOpen] = useState(false);
  const propertyType = row.property_type as PropertyType | null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700"
      >
        <Eye size={11} />
        {copy.panel.solicitudesView}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-slate-900">{copy.panel.solicitudesViewRequest}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 text-slate-400 transition-colors hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <Field label={copy.panel.solicitudesContact} value={`${row.full_name} · ${row.phone}`} />
              <div className="grid grid-cols-2 gap-3">
                <Field label={copy.panel.solicitudesType} value={propertyType ? PROPERTY_TYPE_LABELS[propertyType].es : "—"} />
                <Field label="Ciudad" value={row.city} />
              </div>
              <Field label={copy.panel.solicitudesPriceRange} value={priceRange(row)} />
              <Field label={copy.panel.solicitudesDescription} value={row.description || "—"} />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{copy.panel.status}</p>
                <Badge tone={statusTone[row.status]} className="mt-1">
                  {CLIENT_REQUEST_STATUS_LABELS[row.status]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
