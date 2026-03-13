import { z } from "zod";
import { ValidationError } from "../shared/common";

const currentYear = new Date().getFullYear();

export const createBoatSchema = z.object({
  name: z.string().min(1, ValidationError.REQUIRED).max(100, ValidationError.TOO_LONG),
  manufacturer: z.string().max(100, ValidationError.TOO_LONG).optional().or(z.literal("")),
  model: z.string().max(100, ValidationError.TOO_LONG).optional().or(z.literal("")),
  yearBuilt: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z
      .number()
      .int()
      .min(1900, ValidationError.INVALID)
      .max(currentYear + 1, ValidationError.INVALID)
      .optional()
  ),
  engineCount: z.coerce.number().int().min(0).max(10).default(1),
});

export type CreateBoatInput = z.infer<typeof createBoatSchema>;
