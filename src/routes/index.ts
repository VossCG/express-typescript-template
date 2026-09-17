import { Router } from 'express';

import healthRoutes from './health/route';
import taskRoutes from './tasks/route';

const router = Router();

router.use('/health', healthRoutes);
router.use('/api/v1/tasks', taskRoutes);

export default router;
