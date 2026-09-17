import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

import { env } from './config/env';
import { registry } from './config/openapi';
import './routes';

export const generateOpenApiDocument = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Backend Quick Start API',
      version: '1.0.0',
      description: 'Express, TypeScript, Zod, and PostgreSQL starter API.',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Local development',
      },
    ],
  });
};
