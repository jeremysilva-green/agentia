"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy";

export function JoinMlsForm({
  defaultCi,
  defaultAgencyName,
  reglamentoBody,
  isReaccept,
}: {
  defaultCi: string;
  defaultAgencyName: string;
  reglamentoBody: string;
  isReaccept: boolean;
}) {
  const router = useRouter();
  const [ci, setCi] = useState(defaultCi);
  const [agencyName, setAgencyName] = useState(defaultAgencyName);
  const [accepted, setAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/mls/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ci, agencyName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "No se pudo completar la membresía.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="mlsCi"
          label={copy.mls.ciLabel}
          value={ci}
          onChange={(e) => setCi(e.target.value)}
          required
        />
        <Input
          id="mlsAgency"
          label={copy.mls.agencyLabel}
          placeholder={copy.mls.agencyPlaceholder}
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
        />
      </div>

      {reglamentoBody && (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-[var(--line)] bg-black/30 p-4 text-xs leading-relaxed whitespace-pre-line text-[#bdbdbd]">
          {reglamentoBody}
        </div>
      )}

      <label className="flex items-start gap-2 text-sm text-[#cfcfcf]">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 accent-[var(--em)]"
        />
        {copy.mls.reglamentoCheckbox}
      </label>

      {error && <p className="text-sm text-[#ff8a8a]">{error}</p>}

      <Button type="submit" disabled={isPending || !accepted || !ci.trim()} className="self-start">
        {isPending ? copy.mls.joining : isReaccept ? copy.mls.reaccept : copy.mls.join}
      </Button>
    </form>
  );
}
