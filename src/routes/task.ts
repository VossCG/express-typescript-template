import { taskDocs } from '../contracts/task';
import { createOpenApiRouter } from '../helpers/openApiRouter';
import taskController from '../modules/task';

const router = createOpenApiRouter({ tags: ['Tasks'] });

router.get('/', taskDocs.list, taskController.list);

router.post('/', taskDocs.create, taskController.create);

router.get('/:id', taskDocs.getById, taskController.getById);

router.patch('/:id', taskDocs.update, taskController.update);

router.delete('/:id', taskDocs.delete, taskController.delete);

export default router;
