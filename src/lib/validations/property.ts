import { z } from "zod";
import { PROPERTY_TYPE_VALUES } from "@/lib/constants/propertyTypes";
import { isLikelyGoogleMapsUrl } from "@/lib/googleMaps";
import { isLikelyYoutubeUrl } from "@/lib/youtube";
import { isLikelyInstagramReelUrl } from "@/lib/instagram";

const emptyToUndefined = (val: unknown) => (val === "" || val == null ? undefined : val);
const optionalNonNegativeInt = z.preprocess(emptyToUndefined, z.coerce.number().int().nonnegative()).optional();
const optionalNonNegativeNumber = z.preprocess(emptyToUndefined, z.coerce.number().nonnegative()).optional();

const emptyToUndefinedString = (val: unknown) => (val === "" || val == null ? undefined : val);
const optionalTrimmedString = z.preprocess(emptyToUndefinedString, z.string()).optional();
const optionalPositiveNumber = z.preprocess(emptyToUndefined, z.coerce.number().positive()).optional();
const optionalPercentage = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0).max(100)
).optional();

export const propertySchema = z
  .object({
    title: z.string().min(4, "El título es muy corto").max(120),
    description: z.string().min(20, "Agregá una descripción más completa"),
    listingType: z.enum(["sale"]),
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
    youtubeUrl: z
      .string()
      .optional()
      .refine((value) => !value || isLikelyYoutubeUrl(value), {
        message: "Pegá un enlace de YouTube válido.",
      }),
    instagramReelUrl: z
      .string()
      .optional()
      .refine((value) => !value || isLikelyInstagramReelUrl(value), {
        message: "Pegá un enlace de Instagram Reel válido.",
      }),
    status: z.enum(["available", "sold", "rented", "draft"]).default("available"),
    published: z.coerce.boolean().default(true),
    garage: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    negotiationType: z.array(z.string()).default([]),
    negotiationDetails: z.string().optional(),

    // Listing kind — defaults to "standard" so every call site that doesn't
    // know about the new kinds keeps working exactly as before.
    listingKind: z.enum(["standard", "proyecto_en_pozo", "modelo"]).default("standard"),
    constructionStage: z.enum(["terminada", "en_construccion", "en_pozo"]).default("terminada"),

    // Proyecto en Pozo
    developerName: optionalTrimmedString,
    estimatedDeliveryDate: optionalTrimmedString,
    constructionProgressPct: optionalPercentage,
    totalUnits: optionalNonNegativeInt,
    paymentPlanDepositPct: optionalPercentage,
    paymentPlanInstallmentsText: optionalTrimmedString,
    paymentPlanBalancePct: optionalPercentage,
    paymentPlanFinancingOptions: z.array(z.string()).default([]),
    typologyName: z.array(z.string()).default([]),
    typologyBedrooms: z.array(z.string()).default([]),
    typologyAreaM2: z.array(z.string()).default([]),
    typologyPriceFrom: z.array(z.string()).default([]),
    typologyUnitsAvailable: z.array(z.string()).default([]),

    // Modelo de Construcción
    coverageCities: z.array(z.string()).default([]),
    modelConstructionTermMonths: optionalNonNegativeInt,
    modelIncludesLand: z.enum(["no_terreno_cliente", "si_incluido", "opcional"]).optional(),
    modelMaterialsText: optionalTrimmedString,
    modelFinancingType: z.enum(["che_roga_pora", "bancaria", "propia"]).optional(),
    modelInstallmentFrom: optionalPositiveNumber,
    modelDownPaymentText: optionalTrimmedString,
    modelQualifyingRequirements: optionalTrimmedString,

    // Comisión y referidos (Proyecto en Pozo / Modelo only)
    commissionTriggerLabel: optionalTrimmedString,
    commissionAgentPct: optionalPercentage,
    referralRewardType: z.enum(["percentage", "fixed"]).optional(),
    referralRewardValue: optionalPositiveNumber,
    referralAttributionDays: optionalNonNegativeInt,
  })
  .superRefine((data, ctx) => {
    if (data.listingKind === "proyecto_en_pozo") {
      if (!data.developerName) {
        ctx.addIssue({
          code: "custom",
          path: ["developerName"],
          message: "Ingresá el nombre de la desarrolladora/constructora.",
        });
      }
      if (data.typologyName.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["typologyName"],
          message: "Agregá al menos una tipología.",
        });
      }
    }
    if (data.listingKind === "modelo" && data.coverageCities.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["coverageCities"],
        message: "Seleccioná al menos una ciudad de cobertura.",
      });
    }
  });

export type PropertyInput = z.infer<typeof propertySchema>;
