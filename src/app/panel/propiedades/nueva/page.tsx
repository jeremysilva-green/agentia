import { Card } from "@/components/ui/Card";
import { PropertyForm } from "@/components/panel/PropertyForm";
import { createProperty } from "@/lib/actions/properties";

export default function NuevaPropiedadPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-white">Nueva propiedad</h1>
      <Card className="border-emerald-100! bg-emerald-50! p-6 sm:p-8">
        <PropertyForm action={createProperty} submitLabel="Crear propiedad" />
      </Card>
    </div>
  );
}
