import type { RouteConfig, ZodContentObject } from '@asteasolutions/zod-to-openapi';
import { type RequestHandler, Router } from 'express';
import type { z } from 'zod';

import {
  baseSuccessResponseSchema,
  errorResponses,
  registry,
  successResponseSchema,
} from '../config/openapi';
import { validate } from './validator';

type RouteRequest = NonNullable<RouteConfig['request']>;
type ErrorStatus = keyof typeof errorResponses;
type ContentType = Extract<keyof ZodContentObject, string>;
type SupportedMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
type RouteHandlers = [RequestHandler, ...RequestHandler[]];

export interface OpenApiRouteOptions {
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  requestSchema?: z.ZodTypeAny;
  responseSchema?: z.ZodTypeAny;
  params?: RouteRequest['params'];
  query?: RouteRequest['query'];
  contentType?: ContentType;
  responseStatus?: number;
  responseDescription?: string;
  errorStatuses?: readonly ErrorStatus[];
}

export type OpenApiOperationOptions = Omit<
  OpenApiRouteOptions,
  'requestSchema' | 'responseSchema' | 'responseStatus' | 'errorStatuses'
> & {
  body?: z.ZodTypeAny;
  response?: z.ZodTypeAny;
  status?: number;
  errors?: readonly ErrorStatus[];
};

type OpenApiRouteInput = OpenApiRouteOptions | OpenApiOperationOptions;

type RegisterRoute = (path: string, options: OpenApiRouteInput, ...handlers: RouteHandlers) => void;

interface OpenApiRouteDefinition {
  method: SupportedMethod;
  path: string;
  options: OpenApiRouteOptions;
}

interface OpenApiRouterMetadata {
  tags?: string[];
  definitions: OpenApiRouteDefinition[];
}

const routerMetadata = Symbol('openApiRouterMetadata');

export interface OpenApiRouter {
  readonly expressRouter: Router;
  readonly get: RegisterRoute;
  readonly post: RegisterRoute;
  readonly put: RegisterRoute;
  readonly patch: RegisterRoute;
  readonly delete: RegisterRoute;
  readonly [routerMetadata]: OpenApiRouterMetadata;
}

export interface CreateOpenApiRouterOptions {
  tags?: string[];
}

export const defineOperation = (options: OpenApiOperationOptions): OpenApiOperationOptions =>
  options;

const toRouteOptions = (input: OpenApiRouteInput): OpenApiRouteOptions => {
  const { body, response, status, errors, ...rest } = input as OpenApiOperationOptions &
    OpenApiRouteOptions;

  return {
    ...rest,
    ...(body ? { requestSchema: body } : {}),
    ...(response ? { responseSchema: response } : {}),
    ...(status !== undefined ? { responseStatus: status } : {}),
    ...(errors ? { errorStatuses: errors } : {}),
  };
};

const joinPaths = (basePath: string, routePath: string): string => {
  const segments = [basePath, routePath].flatMap((path) => path.split('/')).filter(Boolean);

  return `/${segments.join('/')}`;
};

const toOpenApiPath = (path: string): string => path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');

const registerOpenApiPath = (
  method: SupportedMethod,
  path: string,
  options: OpenApiRouteOptions,
  defaultTags?: string[],
): void => {
  const { contentType = 'application/json', errorStatuses = [], responseStatus = 200 } = options;

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
    method,
    path,
    summary: options.summary,
    description: options.description,
    tags: options.tags ?? defaultTags,
    operationId: options.operationId,
    ...(Object.keys(request).length > 0 ? { request } : {}),
    responses,
  });
};

/**
 * Creates an Express router whose route declarations also install validation
 * and collect the OpenAPI metadata registered when the router is mounted.
 */
export const createOpenApiRouter = ({ tags }: CreateOpenApiRouterOptions): OpenApiRouter => {
  const expressRouter = Router();
  const definitions: OpenApiRouteDefinition[] = [];

  const addRoute = (
    method: SupportedMethod,
    path: string,
    options: OpenApiRouteOptions,
    handlers: RouteHandlers,
  ): void => {
    definitions.push({ method, path, options });

    const validationHandlers: RequestHandler[] = [];
    if (options.params) {
      validationHandlers.push(validate(options.params, 'params'));
    }
    if (options.query) {
      validationHandlers.push(validate(options.query, 'query'));
    }
    if (options.requestSchema) {
      validationHandlers.push(validate(options.requestSchema));
    }

    expressRouter[method](path, ...validationHandlers, ...handlers);
  };

  const defineRoute =
    (method: SupportedMethod): RegisterRoute =>
    (path, options, ...handlers) => {
      addRoute(method, path, toRouteOptions(options), handlers);
    };

  return {
    expressRouter,
    get: defineRoute('get'),
    post: defineRoute('post'),
    put: defineRoute('put'),
    patch: defineRoute('patch'),
    delete: defineRoute('delete'),
    [routerMetadata]: { tags, definitions },
  };
};

/**
 * Mounts a documented router and applies the same base path to Express and
 * every OpenAPI operation registered by that router.
 */
export const mountOpenApiRouter = (
  parentRouter: Router,
  basePath: string,
  router: OpenApiRouter,
): void => {
  const { definitions, tags } = router[routerMetadata];

  for (const definition of definitions) {
    registerOpenApiPath(
      definition.method,
      toOpenApiPath(joinPaths(basePath, definition.path)),
      definition.options,
      tags,
    );
  }

  parentRouter.use(basePath, router.expressRouter);
};
