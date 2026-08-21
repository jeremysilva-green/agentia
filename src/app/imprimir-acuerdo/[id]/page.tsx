import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AcuerdoPrintView } from "@/components/panel/AcuerdoPrintView";
import { PrintButton } from "@/components/panel/PrintButton";

export default async function AcuerdoImprimirPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { data: agreement } = await supabase.from("private_agreements").select("*").eq("id", id).single();
  if (!agreement || agreement.agent_id !== user.id) notFound();

  return (
    <div className="min-h-screen bg-slate-100 py-6">
      <div className="mx-auto mb-4 flex max-w-3xl justify-end px-4 print:hidden">
        <PrintButton />
      </div>
      <AcuerdoPrintView agreement={agreement} />
    </div>
  );
}
