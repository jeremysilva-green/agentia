import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const [{ data: property }, { data: images }, { data: typologies }, { data: coverageCities }] = await Promise.all([
    supabase.from("properties").select("*").eq("id", propertyId).eq("agent_id", user.id).single(),
    supabase
      .from("property_images")
      .select("*")
      .eq("property_id", propertyId)
      .order("position", { ascending: true }),
    supabase
      .from("property_typologies")
      .select("*")
      .eq("property_id", propertyId)
      .order("position", { ascending: true }),
    supabase.from("property_coverage_cities").select("*").eq("property_id", propertyId),
  ]);

  if (!property) notFound();

  const boundUpdate = updateProperty.bind(null, propertyId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-white">Editar propiedad</h1>
        <DeletePropertyButton propertyId={propertyId} />
      </div>

      <section className="pf-dark rounded-[22px] border border-[var(--line)] bg-[var(--ink-2)] p-5 sm:p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-white">Fotos</h2>
        <PropertyPhotoManager
          propertyId={propertyId}
          agentId={user.id}
          initialImages={images ?? []}
        />
      </section>

      <PropertyForm
        action={boundUpdate}
        defaultValues={property}
        defaultTypologies={typologies ?? []}
        defaultCoverageCities={coverageCities ?? []}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
