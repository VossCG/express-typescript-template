import type {
  RouteConfig,
  ZodContentObject,
} from '@asteasolutions/zod-to-openapi';
import type { z } from 'zod';

import {
  baseSuccessResponseSchema,
  errorResponses,
  registry,
  successResponseSchema,
} from '../config/openapi';

type RouteRequest = NonNullable<RouteConfig['request']>;
type ErrorStatus = keyof typeof errorResponses;
type ContentType = Extract<keyof ZodContentObject, string>;

export interface RouteOptions {
  path: string;
  method: RouteConfig['method'];
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  requestSchema?: z.ZodTypeAny;
  responseSchema?: z.ZodTypeAny;
  params?: RouteRequest['params'];
  query?: RouteRequest['query'];
  security?: RouteConfig['security'];
  contentType?: ContentType;
  responseStatus?: number;
  responseDescription?: string;
  errorStatuses?: readonly ErrorStatus[];
}

const registerOpenApiPath = (options: RouteOptions): void => {
  const {
    contentType = 'application/json',
    errorStatuses = [],
    responseStatus = 200,
  } = options;

  const request: RouteConfig['request'] = {
    ...(options.params ? { params: options.params } : {}),
    ...(options.query ? { query: options.query } : {}),
    ...(options.requestSchema
      ? {
          body: {
            content: {
              [contentType]: { schema: options.requestSchema },
            },
          },
        }
      : {}),
  };

  const responses: RouteConfig['responses'] = {
    [responseStatus]: {
      description: options.responseDescription ?? 'Successful response',
      ...(responseStatus === 204
        ? {}
        : {
            content: {
              'application/json': {
                schema: options.responseSchema
                  ? successResponseSchema(options.responseSchema)
                  : baseSuccessResponseSchema,
              },
            },
          }),
    },
  };

  for (const status of errorStatuses) {
    responses[status] = errorResponses[status];
  }

  registry.registerPath({
    method: options.method,
    path: options.path,
    summary: options.summary,
    description: options.description,
    tags: options.tags,
    operationId: options.operationId,
    security: options.security,
    ...(Object.keys(request).length > 0 ? { request } : {}),
    responses,
  });
};

/**
 * Registers an OpenAPI route. The returned function also allows the helper to
 * be used as a method decorator without changing its direct-call API.
 */
export const route = (options: RouteOptions): MethodDecorator => {
  registerOpenApiPath(options);

  return (_target, _propertyKey, descriptor) => descriptor;
};
