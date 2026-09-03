// One-off script to populate public.sifen_cities (SIFEN department/
// district/city codes, one row per city) so agents can pick a fiscal
// city from a single dropdown instead of three cascading selects.
//
// ⚠️ NOT WIRED UP YET — the data source below is a placeholder.
// FacturaSend's public docs (facturasend.com.py/documentacion/) do NOT
// document a "list all departamentos/distritos/ciudades" endpoint —
// that was an unverified assumption carried over from the original
// scaffold, not something confirmed to exist. Before running this for
// real, do ONE of:
//   1. Ask FacturaSend support (once you have a real account) whether a
//      private/console-only geo-lookup endpoint exists — check
//      console.facturasend.com.py or their support channel.
//   2. Source SIFEN's own official department/district/city codification
//      directly — it's published in DNIT/SET's "Manual Técnico SIFEN"
//      geo-code tables, independent of FacturaSend. This is the
//      authoritative source either way, since FacturaSend just requires
//      you to supply valid SIFEN codes, not codes it invents itself.
//
// Run with `npx tsx scripts/seed-sifen-cities.ts` once a real data
// source is wired into fetchSifenCities() below.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SifenCityRow {
  ciudad_id: number;
  ciudad_desc: string;
  distrito_id: number;
  distrito_desc: string;
  departamento_id: number;
  departamento_desc: string;
}

async function fetchSifenCities(): Promise<SifenCityRow[]> {
  throw new Error(
    "fetchSifenCities() is not implemented yet — see the header comment in this file for how to source real SIFEN geo-code data before running this script."
  );
}

async function main() {
  const cities = await fetchSifenCities();

  const { error } = await supabase.from("sifen_cities").upsert(cities, { onConflict: "ciudad_id" });

  if (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }

  console.log(`Seeded ${cities.length} sifen_cities rows.`);
}

main();
