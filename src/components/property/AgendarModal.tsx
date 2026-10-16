"use client";

import { useState, useTransition } from "react";
import { CalendarCheck, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requestVisit } from "@/lib/actions/agendar";
import { copy } from "@/lib/copy";

const darkInputClassName =
  "border-white/15 bg-white/5 text-white placeholder:text-white/30 focus:border-emerald-400 focus:ring-emerald-400/20";

export function AgendarModal({ propertyId, refCode }: { propertyId: string; refCode?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function close() {
    setOpen(false);
    setError(null);
    setDone(false);
    setName("");
    setPhone("");
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await requestVisit({ propertyId, buyerName: name, buyerPhone: phone, ref: refCode });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDone(true);
      setTimeout(close, 2500);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full border-white/15! bg-white/5! text-white! hover:border-emerald-400! hover:text-emerald-300!"
        onClick={() => setOpen(true)}
      >
        <CalendarCheck size={18} />
        {copy.property.schedule}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={close}>
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-white">{copy.property.scheduleModalTitle}</h2>
              <button type="button" onClick={close} className="text-white/50 transition-colors hover:text-white">
                <X size={18} />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400">
                  <Check size={22} />
                </span>
                <p className="text-sm text-white/80">{copy.property.scheduleSuccess}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-white/60">{copy.property.scheduleModalBody}</p>
                <Input
                  id="agendarNombre"
                  label={copy.property.scheduleNameLabel}
                  labelClassName="text-white/70"
                  className={darkInputClassName}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                />
                <Input
                  id="agendarWhatsapp"
                  label={copy.property.schedulePhoneLabel}
                  labelClassName="text-white/70"
                  className={darkInputClassName}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                />

                {error && <p className="text-sm text-red-400">{error}</p>}

                <Button
                  type="button"
                  size="md"
                  className="w-full bg-emerald-600! hover:bg-emerald-700!"
                  disabled={isPending}
                  onClick={handleSubmit}
                >
                  {isPending ? copy.property.scheduleSending : copy.property.scheduleSubmit}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
