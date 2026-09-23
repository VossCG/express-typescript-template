import { defineOperation } from '../helpers/openApiRouter';
import { healthSchema, readinessSchema } from '../schemas/health';

export const healthDocs = {
  check: defineOperation({
    summary: 'Check API process liveness',
    response: healthSchema,
    responseDescription: 'API is running',
  }),
  ready: defineOperation({
    summary: 'Check database readiness',
    response: readinessSchema,
    responseDescription: 'API and database are ready',
    errors: [503],
  }),
};
