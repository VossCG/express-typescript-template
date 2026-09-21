import { createTaskController } from '../controllers/task';
import * as db from '../database';
import { createTaskRepository } from '../repositories/task';
import { createTaskService } from '../services/task';

const taskRepository = createTaskRepository(db.sql);
const taskService = createTaskService(taskRepository);
const taskController = createTaskController(taskService);

export default taskController;
