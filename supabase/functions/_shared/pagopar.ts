// Pagopar API client shared by every Edge Function in this project.
//
// Token recipes (per the "Catastro de tarjetas - Pagos recurrentes -
// Preautorización" v3.0 doc and the standard-checkout summary you gave me):
//   - pago-recurrente/3.0/*  -> sha1(token_privado + "PAGO-RECURRENTE")
//   - iniciar-transaccion    -> sha1(token_privado + id_pedido + monto_total)
//   - pedidos/1.1/traer      -> sha1(token_privado + "CONSULTA")
//   - webhook verification   -> sha1(token_privado + hash_pedido)
//
// NOT hardcoded anywhere: PAGOPAR_TOKEN_PUBLICO / PAGOPAR_TOKEN_PRIVADO must
// be set via `supabase secrets set` and are only ever read through
// Deno.env.get below.

const API_BASE = "https://api.pagopar.com/api";

export function getPublicToken() {
  const value = Deno.env.get("PAGOPAR_TOKEN_PUBLICO");
  if (!value) throw new Error("Falta el secreto PAGOPAR_TOKEN_PUBLICO");
  return value;
}

function getPrivateToken() {
  const value = Deno.env.get("PAGOPAR_TOKEN_PRIVADO");
  if (!value) throw new Error("Falta el secreto PAGOPAR_TOKEN_PRIVADO");
  return value;
}

export async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const buildRecurrenteToken = () => sha1Hex(`${getPrivateToken()}PAGO-RECURRENTE`);
export const buildConsultaToken = () => sha1Hex(`${getPrivateToken()}CONSULTA`);
export const buildIniciarTransaccionToken = (idPedido: string, montoTotal: string) =>
  sha1Hex(`${getPrivateToken()}${idPedido}${montoTotal}`);
export const buildWebhookVerifyToken = (hashPedido: string) => sha1Hex(`${getPrivateToken()}${hashPedido}`);

async function pagoparFetch<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await response.json()) as T;
}

type PagoparResult<T> = { respuesta: true; resultado: T } | { respuesta: false; resultado: string };

// --- Pago recurrente / catastro de tarjetas 3.0 -----------------------------

export async function agregarCliente(params: {
  identificador: number;
  nombreApellido: string;
  email: string;
  celular: string;
}): Promise<PagoparResult<{ id_comprador_comercio: string; nombres_apellidos: string; email: string; celular: string }>> {
  return pagoparFetch(`${API_BASE}/pago-recurrente/3.0/agregar-cliente/`, {
    token: await buildRecurrenteToken(),
    token_publico: getPublicToken(),
    identificador: params.identificador,
    nombre_apellido: params.nombreApellido,
    email: params.email,
    celular: params.celular,
  });
}

export async function agregarTarjeta(params: {
  url: string;
  proveedor: "Bancard" | "uPay";
  identificador: number;
}): Promise<PagoparResult<string>> {
  return pagoparFetch(`${API_BASE}/pago-recurrente/3.0/agregar-tarjeta/`, {
    token: await buildRecurrenteToken(),
    token_publico: getPublicToken(),
    url: params.url,
    proveedor: params.proveedor,
    identificador: params.identificador,
  });
}

export async function confirmarTarjeta(params: { url: string; identificador: number }): Promise<PagoparResult<string>> {
  return pagoparFetch(`${API_BASE}/pago-recurrente/3.0/confirmar-tarjeta/`, {
    token: await buildRecurrenteToken(),
    token_publico: getPublicToken(),
    url: params.url,
    identificador: params.identificador,
  });
}

export type TarjetaCatastrada = {
  tarjeta: string;
  url_logo: string;
  tarjeta_numero: string;
  marca: string;
  emisor: string;
  alias_token: string;
  proveedor: "Bancard" | "uPay";
  tipo_tarjeta: "Crédito" | "Débito" | "Prepaga";
};

export async function listarTarjeta(identificador: number): Promise<PagoparResult<TarjetaCatastrada[]>> {
  return pagoparFetch(`${API_BASE}/pago-recurrente/3.0/listar-tarjeta/`, {
    token: await buildRecurrenteToken(),
    token_publico: getPublicToken(),
    identificador,
  });
}

export async function eliminarTarjeta(params: { tarjetaAliasToken: string; identificador: number }): Promise<PagoparResult<string>> {
  return pagoparFetch(`${API_BASE}/pago-recurrente/3.0/eliminar-tarjeta/`, {
    token: await buildRecurrenteToken(),
    token_publico: getPublicToken(),
    tarjeta: params.tarjetaAliasToken,
    identificador: params.identificador,
  });
}

export async function pagar(params: {
  hashPedido: string;
  tarjetaAliasToken: string;
  identificador: number;
}): Promise<PagoparResult<string>> {
  return pagoparFetch(`${API_BASE}/pago-recurrente/3.0/pagar/`, {
    token: await buildRecurrenteToken(),
    token_publico: getPublicToken(),
    hash_pedido: params.hashPedido,
    tarjeta: params.tarjetaAliasToken,
    identificador: params.identificador,
  });
}

// --- Standard checkout -------------------------------------------------------
//
// NOT FULLY DOCUMENTED IN THE PROVIDED PDFs: your message summarized
// iniciar-transaccion as "token sha1(token_privado + id_pedido + monto_total),
// devuelve resultado.data (el hash)", but Pagopar's real endpoint for this
// product normally also expects comprador info (email, ruc/documento,
// teléfono, dirección), a `forma_pago`, and an `items[]` array — none of
// which were in either PDF. The fields below are the ones we can be certain
// of; the rest are placeholders you'll need to fill in from Pagopar's actual
// "iniciar-transaccion" API reference before this will work against the real
// API. Do not treat this payload as complete.
export async function iniciarTransaccion(params: {
  idPedidoComercio: string;
  montoTotal: number;
  comprador: { email: string; nombre: string; telefono: string; documento?: string };
}): Promise<PagoparResult<{ data: string }>> {
  const montoStr = String(params.montoTotal);
  return pagoparFetch(`${API_BASE}/comercios/2.0/iniciar-transaccion`, {
    token: await buildIniciarTransaccionToken(params.idPedidoComercio, montoStr),
    token_publico: getPublicToken(),
    id_pedido_comercio: params.idPedidoComercio,
    monto_total: montoStr,
    // TODO(confirm with Pagopar's real iniciar-transaccion reference):
    // comprador / items / forma_pago fields go here — not documented in the
    // PDFs provided for this integration.
    comprador: params.comprador,
  });
}

export function buildCheckoutRedirectUrl(hash: string) {
  return `https://www.pagopar.com/pagos/${hash}`;
}

export async function consultarPedido(hash: string): Promise<PagoparResult<Record<string, unknown>>> {
  return pagoparFetch(`${API_BASE}/pedidos/1.1/traer`, {
    token: await buildConsultaToken(),
    token_publico: getPublicToken(),
    hash_pedido: hash,
  });
}
