const FACTURASEND_BASE = "https://api.facturasend.com.py";
const TENANT_ID = process.env.FACTURASEND_TENANT_ID!;
const API_KEY = process.env.FACTURASEND_API_KEY!;

function headers() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json; charset=utf-8",
  };
}

export interface ClienteDTE {
  contribuyente: boolean;
  ruc?: string;
  razonSocial: string;
  nombreFantasia?: string;
  tipoOperacion: number;
  direccion: string;
  numeroCasa?: string;
  departamento: number;
  departamentoDescripcion: string;
  distrito: number;
  distritoDescripcion: string;
  ciudad: number;
  ciudadDescripcion: string;
  pais: string;
  paisDescripcion: string;
  tipoContribuyente?: number;
  documentoTipo: number;
  documentoNumero: string;
  telefono?: string;
  celular?: string;
  email?: string;
  codigo?: string; // our agent_profiles.id, for cross-referencing in FacturaSend's console
}

export interface ItemDTE {
  codigo: string;
  descripcion: string;
  unidadMedida: number;
  cantidad: number;
  precioUnitario: number;
  ivaTipo: number;
  ivaBase: number;
  iva: number;
}

export interface CrearDocumentoParams {
  tipoDocumento: number; // 1 = Factura electrónica
  establecimiento: number;
  punto: string;
  numero: number;
  descripcion: string;
  fecha: string; // ISO 8601
  tipoEmision: number;
  tipoTransaccion: number;
  tipoImpuesto: number;
  moneda: "PYG";
  cliente: ClienteDTE;
  usuario: { documentoTipo: number; documentoNumero: string; nombre: string; cargo?: string };
  factura: { presencia: number };
  condicion: {
    tipo: number;
    entregas: Array<{
      tipo: number;
      monto: string;
      moneda: string;
      monedaDescripcion: string;
      cambio: number;
    }>;
  };
  items: ItemDTE[];
}

interface DEListItem {
  // Confirmed against facturasend.com.py/documentacion/ — the create
  // response does NOT include an internal id, only these fields. Status
  // must be polled by CDC (see consultarEstadoPorCdc below), not by id.
  cdc: string;
  numero: string;
  estado?: string;
}

interface CrearDocumentoResponse {
  success: boolean;
  error?: string;
  errores?: unknown[];
  result?: { deList: DEListItem[]; loteId: number };
}

/**
 * Creates one electronic document (invoice). FacturaSend requires a JSON
 * array in the body even for a single document, and processes it
 * asynchronously — SIFEN's actual approval must be checked separately
 * via consultarEstadoPorCdc(), not read from this response.
 */
export async function crearDocumento(doc: CrearDocumentoParams): Promise<CrearDocumentoResponse> {
  const res = await fetch(`${FACTURASEND_BASE}/${TENANT_ID}/lote/create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify([doc]),
  });

  if (!res.ok) {
    throw new Error(`FacturaSend lote/create failed: HTTP ${res.status}`);
  }

  return res.json();
}

export type Situacion = -1 | 0 | 1 | 2 | 3 | 4 | 98 | 99;
// -1 Borrador · 0 Generado · 1 Enviado en Lote · 2 Aprobado
// 3 Aprobado con observación · 4 Rechazado · 98 Inexistente · 99 Cancelado

interface ConsultarEstadoResponse {
  success: boolean;
  result: {
    id: number;
    situacion: Situacion;
    lote_estado: number;
    info_codigo?: string;
    info_descripcion?: string;
  };
}

/**
 * Polls FacturaSend for the current SIFEN approval status of a document,
 * by CDC — confirmed against facturasend.com.py/documentacion/ as
 * GET /{tenantId}/de/cdc/{cdc}. crearDocumento()'s response never gives
 * us FacturaSend's internal numeric id, so CDC is the only identifier we
 * actually have to look a document back up by.
 */
export async function consultarEstadoPorCdc(cdc: string): Promise<ConsultarEstadoResponse> {
  const res = await fetch(`${FACTURASEND_BASE}/${TENANT_ID}/de/cdc/${cdc}`, {
    method: "GET",
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`FacturaSend de/cdc failed: HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Fetches the KUDE (PDF representation) for one document by CDC —
 * confirmed against facturasend.com.py/documentacion/ as
 * POST /{tenantId}/de/pdf with a cdcList body, returning a base64 string
 * (not a URL — we upload it to our own Storage bucket to get one).
 */
export async function obtenerKudeBase64(cdc: string): Promise<string> {
  const res = await fetch(`${FACTURASEND_BASE}/${TENANT_ID}/de/pdf`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ cdcList: [{ cdc }], type: "base64", format: "a4" }),
  });

  if (!res.ok) {
    throw new Error(`FacturaSend de/pdf failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  // Response shape for a single-document base64 request isn't fully
  // documented — accept either a bare string or a { base64 } wrapper.
  const base64 = typeof data === "string" ? data : (data.base64 ?? data.result?.base64);
  if (!base64) throw new Error("FacturaSend de/pdf returned no base64 content");
  return base64;
}
