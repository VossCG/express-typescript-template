import { Router } from 'express';

import { mountOpenApiRouter } from '../helpers/openApiRouter';
import healthRoutes from './health';
import taskRoutes from './task';

const router = Router();

mountOpenApiRouter(router, '/health', healthRoutes);
mountOpenApiRouter(router, '/api/v1/tasks', taskRoutes);

export default router;
