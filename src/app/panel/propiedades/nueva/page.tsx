import { PropertyForm } from "@/components/panel/PropertyForm";
import { createProperty } from "@/lib/actions/properties";

export default function NuevaPropiedadPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-white">Nueva propiedad</h1>
      <PropertyForm action={createProperty} submitLabel="Crear propiedad" />
    </div>
  );
}
