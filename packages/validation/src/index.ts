export { loginSchema, type LoginInput } from "./auth/login";
export { registerSchema, type RegisterInput } from "./auth/register";
export { createBoatSchema, type CreateBoatInput } from "./boat/create";
export {
  emailSchema,
  passwordSchema,
  uuidSchema,
  ValidationError,
  type ValidationErrorCode,
} from "./shared/common";
