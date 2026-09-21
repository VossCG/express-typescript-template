import cors from 'cors';
import express from 'express';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { generateOpenApiDocument } from './swagger';
import * as errorHandlers from './middleware/errorHandler';


const app = express();

app.disable('x-powered-by');
app.use(
  cors({
    origin: env.CORS_ORIGIN,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(generateOpenApiDocument()));
app.use(routes);

app.use(errorHandlers.notFound);
app.use(errorHandlers.error);

export default app;
