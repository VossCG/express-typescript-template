import * as openApi from '../helpers/openApiRouter';
import { taskDocs } from '../contracts/task';
import taskController from '../modules/task';

const router = openApi.createOpenApiRouter({ tags: ['Tasks'] });

router.get('/', taskDocs.list, taskController.list);
router.get('/:id', taskDocs.getById, taskController.getById);
router.post('/', taskDocs.create, taskController.create);
router.patch('/:id', taskDocs.update, taskController.update);
router.delete('/:id', taskDocs.delete, taskController.delete);

export default router;
