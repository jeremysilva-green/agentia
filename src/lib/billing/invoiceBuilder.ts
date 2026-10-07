import { createServiceClient } from "@/lib/supabase/service";
import { PLANS, type PlanId } from "@/lib/plans";
import type { CrearDocumentoParams } from "./facturasend";

const CONDICION_ENTREGA_TIPO_TARJETA = 3;
const IVA_TIPO = 1;
const IVA_RATE = 10;

// Confirmed live against a real FacturaSend/SIFEN submission (real CDC
// issued) — tipo=99 ("Otro") + a generic description is accepted;
// FacturaSend only requires SOME value here, not the real card brand,
// which dLocal Go's subscription API doesn't expose to us anyway.
const INFO_TARJETA_GENERICA = { tipo: 99, tipoDescripcion: "Tarjeta", medioPago: 2 };

/**
 * Atomically increments and returns the next sequential invoice number.
 * Uses the increment_invoice_number() Postgres function (see migration
 * 0052_billing_invoices.sql) so two invoice creations landing close
 * together never issue the same number.
 */
async function nextInvoiceNumber(): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("increment_invoice_number");
  if (error || data == null) throw error ?? new Error("increment_invoice_number returned no value");
  return data;
}

export type BuildInvoiceResult =
  | { ok: true; payload: CrearDocumentoParams; subscriptionId: string; agentId: string; invoiceNumber: number }
  | { ok: false; reason: string; subscriptionId?: string; agentId?: string };

/**
 * Builds the FacturaSend document payload for one approved payment.
 * Returns { ok: false } (never throws for expected/recoverable cases)
 * when the agent hasn't filled in the fiscal fields this needs yet —
 * the caller should record that as invoice_status: 'blocked_missing_data'
 * rather than a hard error, since it's expected for existing agents until
 * they update their profile.
 */
export async function buildInvoicePayload(paymentId: string): Promise<BuildInvoiceResult> {
  const supabase = createServiceClient();

  const { data: payment, error } = await supabase
    .from("payments")
    .select("*, subscriptions(*, agent_profiles(*, profiles(*)))")
    .eq("id", paymentId)
    .single();

  if (error || !payment) return { ok: false, reason: "Payment not found" };

  const subscription = (
    payment as typeof payment & {
      subscriptions:
        | (Record<string, unknown> & {
            agent_profiles:
              | (Record<string, unknown> & {
                  profiles: { full_name: string | null; phone: string | null; ci: string | null } | null;
                })
              | null;
          })
        | null;
    }
  ).subscriptions;
  const agentProfile = subscription?.agent_profiles;
  const profile = agentProfile?.profiles;

  if (!subscription || !agentProfile || !profile) {
    return { ok: false, reason: "Subscription/agent profile not found" };
  }

  const address = agentProfile.address as string | null;
  const sifenCiudadId = agentProfile.sifen_ciudad_id as number | null;
  const sifenCiudadDesc = agentProfile.sifen_ciudad_desc as string | null;
  const sifenDistritoId = agentProfile.sifen_distrito_id as number | null;
  const sifenDistritoDesc = agentProfile.sifen_distrito_desc as string | null;
  const sifenDepartamentoId = agentProfile.sifen_departamento_id as number | null;
  const sifenDepartamentoDesc = agentProfile.sifen_departamento_desc as string | null;
  const ruc = agentProfile.ruc as string | null;
  const subscriptionId = subscription.id as string;
  const agentId = agentProfile.id as string;

  if (!address || !sifenCiudadId || !sifenDistritoId || !sifenDepartamentoId) {
    return { ok: false, reason: "Agent is missing address/city fiscal fields", subscriptionId, agentId };
  }
  if (!profile.ci && !ruc) {
    return { ok: false, reason: "Agent is missing both cédula and RUC", subscriptionId, agentId };
  }
  if (!profile.full_name) {
    return { ok: false, reason: "Agent is missing full name", subscriptionId, agentId };
  }

  const numero = await nextInvoiceNumber();
  const planId = (payment.plan ?? "basico") as PlanId;
  const amount = payment.amount;
  // Confirmed live: FacturaSend wants yyyy-MM-ddTHH:mm:ss, not a full ISO
  // string — toISOString() always appends milliseconds + "Z", which it
  // rejects with "Invalid time value".
  const fecha = new Date().toISOString().split(".")[0];
  // Confirmed live: for a "No Contribuyente" (CI-only) receiver,
  // tipoOperacion must be 2 (B2C) or 4 (B2F) — 1 is rejected outright.
  // Contribuyentes (real RUC) keep 1, matching the original assumption.
  const tipoOperacion = ruc ? 1 : 2;
  // Confirmed live: numeroCasa is required and FacturaSend rejects an empty
  // value — we don't collect a separate house-number field today, so pull
  // the first number out of the free-text address, falling back to "S/N"
  // (sin número) rather than blocking the invoice entirely.
  const numeroCasa = address.match(/\d+/)?.[0] ?? "S/N";

  const payload: CrearDocumentoParams = {
    tipoDocumento: 1, // Factura electrónica
    establecimiento: 1,
    punto: "001",
    numero,
    descripcion: `Suscripción Agentia — ${PLANS[planId].name}`,
    fecha,
    tipoEmision: 1,
    tipoTransaccion: 1,
    tipoImpuesto: 1,
    moneda: "PYG",
    cliente: {
      contribuyente: Boolean(ruc),
      ruc: ruc ?? undefined,
      razonSocial: profile.full_name,
      tipoOperacion,
      direccion: address,
      numeroCasa,
      departamento: sifenDepartamentoId,
      departamentoDescripcion: sifenDepartamentoDesc ?? "",
      distrito: sifenDistritoId,
      distritoDescripcion: sifenDistritoDesc ?? "",
      ciudad: sifenCiudadId,
      ciudadDescripcion: sifenCiudadDesc ?? "",
      pais: "PRY",
      paisDescripcion: "Paraguay",
      documentoTipo: 1,
      documentoNumero: profile.ci ?? ruc ?? "0",
      email: undefined,
      celular: profile.phone ?? undefined,
      // Confirmed live: FacturaSend rejects this field unless it's 3-15
      // characters — our agent ids are full UUIDs, so it's omitted rather
      // than truncated into something meaningless.
    },
    usuario: {
      documentoTipo: 1,
      documentoNumero: "0",
      nombre: "Agentia",
      // Confirmed live: FacturaSend rejects an empty cargo outright.
      cargo: "Administrador",
    },
    factura: { presencia: 1 },
    condicion: {
      tipo: 1,
      entregas: [
        {
          tipo: CONDICION_ENTREGA_TIPO_TARJETA,
          monto: String(amount),
          moneda: "PYG",
          monedaDescripcion: "Guarani",
          cambio: 0,
          infoTarjeta: INFO_TARJETA_GENERICA,
        },
      ],
    },
    items: [
      {
        codigo: planId,
        descripcion: `Suscripción Agentia — Plan ${PLANS[planId].name}`,
        unidadMedida: 77, // "Unidad" — confirmed against Tablas y Definiciones
        cantidad: 1,
        precioUnitario: amount,
        ivaTipo: IVA_TIPO,
        ivaBase: 100,
        iva: IVA_RATE,
      },
    ],
  };

  return {
    ok: true,
    payload,
    subscriptionId,
    agentId,
    invoiceNumber: numero,
  };
}
