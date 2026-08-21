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
// Reverse-engineered against the live API (2026-08-18) — Pagopar's own docs
// disagree with each other (an old official PDF says one thing, their
// current support KB shows a different real example) and neither one alone
// was enough to get a real response. What actually works, confirmed by
// trial against the live endpoint until `respuesta: true` came back:
//   - the public-key field on THIS endpoint is `public_key`, not
//     `token_publico` (every other Pagopar endpoint — consulta, categorías,
//     ciudades — really does use `token_publico`; this one is inconsistent).
//     Using the wrong name here produced the generic, misleading "Token no
//     corresponde" — indistinguishable from an actual bad token.
//   - `comprador` and each `compras_items` entry need their exact full key
//     set present (empty string/null for anything we don't have) — Pagopar
//     appears to validate the field count, not just required-ness, so a
//     comprador with only some of these keys fails with "no coinciden los
//     campos" rather than a helpful "missing field" message.
//   - `compras_items[].id_producto` (not `producto_id`) and `.categoria`
//     as a numeric-string ("909" = "Otros Servicios", a non-physical
//     service — this is a SaaS subscription charge).
//   - `compras_items[].ciudad` and `comprador.ciudad` take Pagopar's
//     internal ciudad id (see /ciudades/1.1/traer) — "1" = Asunción,
//     hardcoded since nothing in the app collects a matching city today.
//   - `forma_pago: 9` = tarjeta de crédito/débito.
// The token itself (sha1(privado + idPedido + montoTotal)) was correct the
// entire time — it never had anything to do with the failures above.
function formatPagoparDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function iniciarTransaccion(params: {
  idPedidoComercio: string;
  montoTotal: number;
  descripcion: string;
  comprador: { email: string; nombre: string; telefono: string; documento?: string; ruc?: string };
}): Promise<PagoparResult<[{ data: string; pedido: string }]>> {
  const montoStr = String(params.montoTotal);
  const publicToken = getPublicToken();
  const fechaMaximaPago = formatPagoparDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

  return pagoparFetch(`${API_BASE}/comercios/2.0/iniciar-transaccion`, {
    token: await buildIniciarTransaccionToken(params.idPedidoComercio, montoStr),
    public_key: publicToken,
    monto_total: params.montoTotal,
    tipo_pedido: "VENTA-COMERCIO",
    id_pedido_comercio: params.idPedidoComercio,
    descripcion_resumen: params.descripcion,
    fecha_maxima_pago: fechaMaximaPago,
    forma_pago: 9,
    comprador: {
      ruc: params.comprador.ruc ?? "",
      email: params.comprador.email,
      ciudad: "1",
      nombre: params.comprador.nombre,
      telefono: params.comprador.telefono,
      direccion: "",
      // Pagopar rejects: anything under 5 digits ("documento debe estar
      // presente"), non-digit characters like the "-" in a formatted RUC
      // (same error), and tipo_documento values other than "CI" — "RUC"
      // itself isn't in their accepted list ("tipo documento debe estar
      // presente"), even though their own docs show a ruc field separately.
      // All confirmed by trial against the live endpoint. Most agents don't
      // have a ruc on file yet, so the placeholder covers that case until
      // the app actually collects a CI from agents.
      documento: (params.comprador.documento || params.comprador.ruc || "").replace(/\D/g, "") || "00000000",
      coordenadas: "",
      razon_social: params.comprador.nombre,
      tipo_documento: "CI",
      direccion_referencia: null,
    },
    compras_items: [
      {
        ciudad: "1",
        nombre: params.descripcion,
        cantidad: 1,
        categoria: "909",
        public_key: publicToken,
        url_imagen: "",
        descripcion: params.descripcion,
        id_producto: 1,
        precio_total: params.montoTotal,
        vendedor_telefono: "",
        vendedor_direccion: "",
        vendedor_direccion_referencia: "",
        vendedor_direccion_coordenadas: "",
      },
    ],
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
