import { z } from "zod";
import { PROPERTY_TYPE_VALUES } from "@/lib/constants/propertyTypes";
import { isLikelyGoogleMapsUrl } from "@/lib/googleMaps";

const emptyToUndefined = (val: unknown) => (val === "" || val == null ? undefined : val);
const optionalNonNegativeInt = z.preprocess(emptyToUndefined, z.coerce.number().int().nonnegative()).optional();
const optionalNonNegativeNumber = z.preprocess(emptyToUndefined, z.coerce.number().nonnegative()).optional();

const baseFields = {
  fullName: z.string().min(2, "Ingresá tu nombre completo"),
  phone: z.string().min(6, "Ingresá un teléfono de contacto"),
  propertyType: z.enum(PROPERTY_TYPE_VALUES, { message: "Elegí un tipo de propiedad" }),
  city: z.string().min(2, "Ingresá la ciudad"),
  description: z.string().min(10, "Contanos un poco más"),
};

export const vendedorRequestSchema = z.object({
  ...baseFields,
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  currency: z.enum(["PYG", "USD"]).default("PYG"),
  priceIncludesIva: z.coerce.boolean().default(false),
  bedrooms: optionalNonNegativeInt,
  bathrooms: optionalNonNegativeInt,
  areaM2: optionalNonNegativeNumber,
  garage: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  mapsUrl: z
    .string()
    .optional()
    .refine((value) => !value || isLikelyGoogleMapsUrl(value), {
      message: "Pegá un enlace de Google Maps válido.",
    }),
  negotiationType: z.array(z.string()).default([]),
  negotiationDetails: z.string().optional(),
});

export const compradorRequestSchema = z
  .object({
    ...baseFields,
    priceMin: z.coerce.number().positive("Ingresá un monto mínimo válido"),
    priceMax: z.coerce.number().positive("Ingresá un monto máximo válido"),
  })
  .refine((data) => data.priceMax >= data.priceMin, {
    message: "El precio máximo debe ser mayor o igual al mínimo",
    path: ["priceMax"],
  });

export type VendedorRequestInput = z.infer<typeof vendedorRequestSchema>;
export type CompradorRequestInput = z.infer<typeof compradorRequestSchema>;
