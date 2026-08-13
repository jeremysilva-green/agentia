import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentClientRequests } from "@/lib/data/clientRequests";
import { VendedorRequestsTable } from "@/components/panel/VendedorRequestsTable";
import { CompradorRequestsTable } from "@/components/panel/CompradorRequestsTable";
import { copy } from "@/lib/copy";

export default async function SolicitudesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { vendedor, comprador } = await getAgentClientRequests(user.id);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl font-semibold text-white">{copy.panel.solicitudes}</h1>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-white">{copy.panel.solicitudesVendedorTitle}</h2>
        <VendedorRequestsTable rows={vendedor} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-white">{copy.panel.solicitudesCompradorTitle}</h2>
        <CompradorRequestsTable rows={comprador} />
      </div>
    </div>
  );
}
