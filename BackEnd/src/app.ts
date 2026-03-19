import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authPlaceholder } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { createApiRouter } from './routes/apiRoutes';
import { AppContext, createAppContext } from './services/appContext';

interface CreateAppOptions {
  context?: AppContext;
  enableRequestLogging?: boolean;
}

export const createApp = (options: CreateAppOptions = {}) => {
  const app = express();
  return createAppInternal(app, options);
};

const createAppInternal = async (app: express.Express, options: CreateAppOptions) => {
  const context = options.context || await createAppContext();

  app.use(cors({ origin: [env.corsOrigin] }));
  app.use(express.json());

  if (options.enableRequestLogging ?? true) {
    app.use(requestLogger);
  }

  app.use(authPlaceholder);

  const { router: apiRouter, controller } = createApiRouter(context, env.maxWriteRequestsPerMinute);

  app.get('/', controller.getRoot);
  app.get('/health', controller.getHealth);
  app.use('/api', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, context };
};