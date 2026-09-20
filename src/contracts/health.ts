import { defineOperation } from '../helpers/openApiRouter';
import { healthSchema } from '../schemas/health';

export const healthDocs = {
  check: defineOperation({
    summary: 'Check API health',
    response: healthSchema,
    responseDescription: 'API is running',
  }),
};
