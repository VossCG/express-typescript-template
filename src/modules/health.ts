import { createHealthController } from '../controllers/health';
import * as db from '../database';

export const healthController = createHealthController(db.check);
