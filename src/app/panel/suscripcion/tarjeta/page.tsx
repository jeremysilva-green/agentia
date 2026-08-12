import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAgentContext } from "@/lib/data/panel";
import { Card } from "@/components/ui/Card";
import { PagoparCardForm } from "@/components/panel/PagoparCardForm";

export default async function AgregarTarjetaPage() {
  const ctx = await getAgentContext();
  if (!ctx) redirect("/ingresar");

  return (
    <div className="flex flex-col gap-6">
      <Link href="/panel/suscripcion" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} />
        Volver a Suscripción
      </Link>
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900">Guardar tarjeta</h1>
        <p className="text-sm text-slate-500">
          Guardá una tarjeta para que tus próximas renovaciones se cobren automáticamente, sin que tengas que volver
          a pagar cada mes.
        </p>
      </div>
      <Card className="p-6 sm:p-8">
        <PagoparCardForm />
      </Card>
    </div>
  );
}
