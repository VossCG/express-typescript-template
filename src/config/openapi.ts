import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const baseSuccessResponseSchema = z.object({
  success: z.literal(true),
});

export const successResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  baseSuccessResponseSchema.extend({ data });

export const errorResponses = {
  400: {
    description: 'Invalid request',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  404: {
    description: 'Resource not found',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  500: {
    description: 'Internal server error',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  503: {
    description: 'Service unavailable',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
};
