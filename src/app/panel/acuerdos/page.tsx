import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentPrivateAgreements } from "@/lib/data/privateAgreements";
import { AcuerdosList } from "@/components/panel/AcuerdosList";
import { NewAcuerdoButton } from "@/components/panel/NewAcuerdoButton";

export default async function AcuerdosPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  const { open } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const agreements = await getAgentPrivateAgreements(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Acuerdo Privado</h1>
          <p className="text-sm text-slate-300">
            Autorizaciones de venta generadas, con el enlace para que cada propietario complete su parte.
          </p>
        </div>
        <NewAcuerdoButton />
      </div>

      <AcuerdosList agreements={agreements} autoOpenId={open} />
    </div>
  );
}
