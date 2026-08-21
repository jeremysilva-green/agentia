import { z } from "zod";
import { PROPERTY_TYPE_VALUES } from "@/lib/constants/propertyTypes";
import { isLikelyGoogleMapsUrl } from "@/lib/googleMaps";

const emptyToUndefined = (val: unknown) => (val === "" || val == null ? undefined : val);
const optionalNonNegativeInt = z.preprocess(emptyToUndefined, z.coerce.number().int().nonnegative()).optional();
const optionalNonNegativeNumber = z.preprocess(emptyToUndefined, z.coerce.number().nonnegative()).optional();

export const propertySchema = z.object({
  title: z.string().min(4, "El título es muy corto").max(120),
  description: z.string().min(20, "Agregá una descripción más completa"),
  listingType: z.enum(["rent", "sale"]),
  propertyType: z.enum(PROPERTY_TYPE_VALUES).optional(),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  currency: z.enum(["PYG", "USD"]).default("PYG"),
  priceIncludesIva: z.coerce.boolean().default(false),
  city: z.string().min(2, "Ingresá la ciudad"),
  address: z.string().optional(),
  bedrooms: optionalNonNegativeInt,
  bathrooms: optionalNonNegativeInt,
  areaM2: optionalNonNegativeNumber,
  mapsUrl: z
    .string()
    .optional()
    .refine((value) => !value || isLikelyGoogleMapsUrl(value), {
      message: "Pegá un enlace de Google Maps válido.",
    }),
  status: z.enum(["available", "sold", "rented", "draft"]).default("available"),
  published: z.coerce.boolean().default(true),
  garage: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  negotiationType: z.array(z.string()).default([]),
  negotiationDetails: z.string().optional(),
});

export type PropertyInput = z.infer<typeof propertySchema>;
