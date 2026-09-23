import { healthController } from '../modules/health';
import { healthDocs } from '../contracts/health';
import * as openApi from '../helpers/openApiRouter';

const router = openApi.createOpenApiRouter({ tags: ['Health'] });

router.get('/', healthDocs.check, healthController.check);
router.get('/ready', healthDocs.ready, healthController.ready);

export default router;
