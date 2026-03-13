import { z } from "zod";
import { emailSchema, passwordSchema, ValidationError } from "../shared/common";

export const registerSchema = z
  .object({
    fullName: z.string().min(1, ValidationError.REQUIRED).max(100, ValidationError.TOO_LONG),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, ValidationError.REQUIRED),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: ValidationError.MISMATCH,
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
