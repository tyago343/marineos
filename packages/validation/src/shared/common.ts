import { z } from "zod";

export const ValidationError = {
  REQUIRED: "required",
  INVALID: "invalid",
  TOO_SHORT: "tooShort",
  TOO_LONG: "tooLong",
  MISMATCH: "mismatch",
} as const;

export type ValidationErrorCode = (typeof ValidationError)[keyof typeof ValidationError];

export const emailSchema = z
  .string()
  .min(1, ValidationError.REQUIRED)
  .email(ValidationError.INVALID);

export const passwordSchema = z
  .string()
  .min(1, ValidationError.REQUIRED)
  .min(8, ValidationError.TOO_SHORT)
  .max(72, ValidationError.TOO_LONG);

export const uuidSchema = z.string().uuid(ValidationError.INVALID);
