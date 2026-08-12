import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const statusLabel: Record<string, string> = {
  available: "Disponible",
  sold: "Vendida",
  rented: "Alquilada",
  draft: "Borrador",
};

const statusTone: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  available: "success",
  sold: "neutral",
  rented: "warning",
  draft: "neutral",
};

export default async function PropiedadesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { data: properties } = await supabase
    .from("properties")
    .select("*, property_images(id, storage_path, position)")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Propiedades</h1>
        <Link href="/panel/propiedades/nueva">
          <Button size="sm">
            <Plus size={16} />
            Nueva propiedad
          </Button>
        </Link>
      </div>

      {(!properties || properties.length === 0) && (
        <Card className="border-emerald-100! bg-emerald-50! p-8 text-center text-sm text-slate-500">
          Todavía no cargaste propiedades. Creá la primera para empezar a recibir leads.
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties?.map((property) => {
          const cover = [...property.property_images].sort((a, b) => a.position - b.position)[0];
          const coverUrl = cover
            ? supabase.storage.from("property-photos").getPublicUrl(cover.storage_path).data.publicUrl
            : null;

          return (
            <Card key={property.id} className="overflow-hidden border-emerald-100! bg-emerald-50!">
              <div className="relative aspect-video bg-slate-100">
                {coverUrl ? (
                  <Image src={coverUrl} alt={property.title} fill className="object-cover" sizes="360px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    Sin foto
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate text-sm font-semibold text-slate-900">{property.title}</h2>
                  <Badge
                    tone={statusTone[property.status]}
                    className={
                      property.status === "available"
                        ? "border-emerald-200! bg-emerald-100! text-emerald-700!"
                        : undefined
                    }
                  >
                    {statusLabel[property.status]}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {property.city} · {property.listing_type === "rent" ? "Alquiler" : "Venta"}
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {new Intl.NumberFormat("es-PY", { style: "currency", currency: property.currency }).format(
                    property.price
                  )}
                </p>
                {!property.published && (
                  <Badge tone="warning">Sin publicar</Badge>
                )}
                <Link href={`/panel/propiedades/${property.id}/editar`} className="mt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full border-slate-300! bg-slate-200! text-black! hover:bg-slate-300!"
                  >
                    <Pencil size={14} />
                    Editar
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
