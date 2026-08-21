import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { OwnerAcuerdoForm } from "@/components/marketplace/OwnerAcuerdoForm";

export default async function AcuerdoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const service = createServiceClient();

  const { data: agreement } = await service.from("private_agreements").select("*").eq("share_code", code).single();
  if (!agreement) notFound();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-prussian px-5 py-6 sm:px-10">
        <span className="font-display text-2xl uppercase tracking-tight text-white">AGENTIA</span>
        <p className="mt-1 text-sm text-white/70">Autorización para Intermediar Venta de Inmueble</p>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="rounded-2xl border border-emerald-500 bg-slate-200 p-5 shadow-sm sm:p-6">
          <OwnerAcuerdoForm agreement={agreement} />
        </div>
      </div>
    </div>
  );
}
