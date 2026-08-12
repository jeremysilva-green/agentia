import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PropertyForm } from "@/components/panel/PropertyForm";
import { PropertyPhotoManager } from "@/components/panel/PropertyPhotoManager";
import { DeletePropertyButton } from "@/components/panel/DeletePropertyButton";
import { updateProperty } from "@/lib/actions/properties";

export default async function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const [{ data: property }, { data: images }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", propertyId).eq("agent_id", user.id).single(),
    supabase
      .from("property_images")
      .select("*")
      .eq("property_id", propertyId)
      .order("position", { ascending: true }),
  ]);

  if (!property) notFound();

  const boundUpdate = updateProperty.bind(null, propertyId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Editar propiedad</h1>
        <DeletePropertyButton propertyId={propertyId} />
      </div>

      <Card className="border-emerald-100! bg-emerald-50! p-6 sm:p-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Fotos</h2>
        <PropertyPhotoManager
          propertyId={propertyId}
          agentId={user.id}
          initialImages={images ?? []}
        />
      </Card>

      <Card className="border-emerald-100! bg-emerald-50! p-6 sm:p-8">
        <PropertyForm action={boundUpdate} defaultValues={property} submitLabel="Guardar cambios" />
      </Card>
    </div>
  );
}
