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
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--em-2)] uppercase">
            <span className="panel-pulse-dot" />
            Autorizaciones de venta
          </div>
          <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-semibold text-white">Acuerdo Privado</h1>
          <p className="mt-2 max-w-xl text-[15px] text-[var(--muted)]">
            Autorizaciones de venta generadas, con el enlace para que cada propietario complete su parte.
          </p>
        </div>
        <NewAcuerdoButton />
      </div>

      <AcuerdosList agreements={agreements} autoOpenId={open} />
    </div>
  );
}
