import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { Router } from 'express';
import { z } from 'zod';

import { registry } from '../src/config/openapi';
import {
  createOpenApiRouter,
  defineOperation,
  mountOpenApiRouter,
} from '../src/helpers/openApiRouter';

interface ExpressRouteLayer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: unknown[];
  };
}

describe('OpenApiRouter', () => {
  it('uses one route declaration for Express, validation, and OpenAPI', () => {
    const router = createOpenApiRouter({
      tags: ['Test widgets'],
    });
    const bodySchema = z.object({ name: z.string().trim().min(1) });
    const paramsSchema = z.object({ id: z.string().uuid() });

    const operation = defineOperation({
      summary: 'Update a test widget',
      params: paramsSchema,
      body: bodySchema,
      response: bodySchema,
      errors: [400],
    });

    router.patch('/:id', operation, (req, res) => {
      res.json({ success: true, data: req.body });
    });

    const parentRouter = Router();
    mountOpenApiRouter(parentRouter, '/__test/widgets', router);

    const document = new OpenApiGeneratorV3(registry.definitions).generateDocument({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
    });
    const documentedOperation = document.paths['/__test/widgets/{id}']?.patch;

    assert.equal(documentedOperation?.summary, 'Update a test widget');
    assert.deepEqual(documentedOperation?.tags, ['Test widgets']);
    assert.ok(documentedOperation?.requestBody);
    assert.ok(documentedOperation?.responses['200']);
    assert.ok(documentedOperation?.responses['400']);

    const [layer] = (router.expressRouter as Router & { stack: ExpressRouteLayer[] }).stack;

    assert.equal(layer.route?.path, '/:id');
    assert.equal(layer.route?.methods.patch, true);
    assert.equal(layer.route?.stack.length, 3);
  });
});
