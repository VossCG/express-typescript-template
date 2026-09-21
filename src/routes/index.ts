import * as openApi from '../helpers/openApiRouter';
import healthRoutes from './health';
import taskRoutes from './task';
import { Router } from 'express';

const router = Router();

openApi.mountOpenApiRouter(router, '/health', healthRoutes);
openApi.mountOpenApiRouter(router, '/api/v1/tasks', taskRoutes);

export default router;
