import { healthController } from '../controllers/health';
import { healthDocs } from '../contracts/health';
import * as openApi from '../helpers/openApiRouter';

const router = openApi.createOpenApiRouter({ tags: ['Health'] });

router.get('/', healthDocs.check, healthController.check);

export default router;
