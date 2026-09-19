import { z } from 'zod';

export const googleLoginSchema = z.object({
  idToken: z.string().min(1),
});

export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
});

export const loginResponseSchema = z.object({
  user: authUserSchema,
  accessToken: z.string(),
});

export const refreshResponseSchema = z.object({
  accessToken: z.string(),
});

export const logoutAllResponseSchema = z.object({
  revokedSessions: z.number().int().nonnegative(),
});
