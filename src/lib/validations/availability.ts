import { z } from "zod";
import { DAY_OF_WEEK_VALUES } from "@/lib/constants/dayOfWeek";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const availabilityEntrySchema = z
  .object({
    day_of_week: z.enum(DAY_OF_WEEK_VALUES),
    start_time: z.string().regex(timePattern, "Hora inválida"),
    end_time: z.string().regex(timePattern, "Hora inválida"),
  })
  .refine((entry) => entry.end_time > entry.start_time, {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["end_time"],
  });

export const availabilitySchema = z.array(availabilityEntrySchema).max(DAY_OF_WEEK_VALUES.length);

export type AvailabilityEntryInput = z.infer<typeof availabilityEntrySchema>;
