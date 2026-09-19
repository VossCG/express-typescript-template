import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';
import { generateOpenApiDocument } from './swagger';

const app = express();

app.disable('x-powered-by');
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_ORIGIN !== '*',
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(generateOpenApiDocument()));
app.use(routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
