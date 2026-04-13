import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .email();

export const displayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(64);

export const passwordSchema = z
  .string()
  .min(12)
  .max(256);

export const signupSchema = z.object({
  email: emailSchema,
  displayName: displayNameSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
