import { redirect } from "next/navigation";
import { Tag, Key } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAgentClientRequests } from "@/lib/data/clientRequests";
import { VendedorRequestsTable } from "@/components/panel/VendedorRequestsTable";
import { CompradorRequestsTable } from "@/components/panel/CompradorRequestsTable";
import { Reveal } from "@/components/panel/theme/Reveal";
import { copy } from "@/lib/copy";

export default async function SolicitudesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { vendedor, comprador } = await getAgentClientRequests(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
          <span className="panel-pulse-dot" />
          Bandeja de entrada
        </div>
        <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">{copy.panel.solicitudes}</h1>
      </div>

      <div className="grid gap-7 lg:grid-cols-2">
        <Reveal className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#13c47f33] bg-[#13c47f17] text-[var(--em-2)]">
              <Tag size={19} />
            </span>
            <h2 className="font-display text-xl font-semibold text-white">{copy.panel.solicitudesVendedorTitle}</h2>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--ink-2)] px-2.5 py-1 text-[12.5px] text-[var(--muted)]">
              <b className="font-display text-white">{vendedor.length}</b> solicitudes
            </span>
          </div>
          <VendedorRequestsTable rows={vendedor} />
        </Reveal>

        <Reveal delay={1} className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#13c47f33] bg-[#13c47f17] text-[var(--em-2)]">
              <Key size={19} />
            </span>
            <h2 className="font-display text-xl font-semibold text-white">{copy.panel.solicitudesCompradorTitle}</h2>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--ink-2)] px-2.5 py-1 text-[12.5px] text-[var(--muted)]">
              <b className="font-display text-white">{comprador.length}</b> solicitudes
            </span>
          </div>
          <CompradorRequestsTable rows={comprador} />
        </Reveal>
      </div>
    </div>
  );
}
