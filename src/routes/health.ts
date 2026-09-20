import { healthDocs } from '../contracts/health';
import { healthController } from '../controllers/health';
import { createOpenApiRouter } from '../helpers/openApiRouter';

const router = createOpenApiRouter({ tags: ['Health'] });

router.get('/', healthDocs.check, healthController.check);

export default router;
