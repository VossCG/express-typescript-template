import { Router } from 'express';

import { sql } from '../database';
import { createTaskRepository } from '../repositories/task';
import { createTaskService } from '../services/task';
import healthRoutes from './health';
import { createTaskRouter } from './task';

const router = Router();
const taskRepository = createTaskRepository(sql);
const taskService = createTaskService(taskRepository);
const taskRoutes = createTaskRouter(taskService);

router.use('/health', healthRoutes);
router.use('/api/v1/tasks', taskRoutes);

export default router;
