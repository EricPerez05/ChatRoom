import type { APIGatewayProxyEvent, Context, Callback } from 'aws-lambda';
import serverlessExpress from '@vendia/serverless-express';
import { createApp } from './app';

let cachedHandler: ReturnType<typeof serverlessExpress> | null = null;

const getHandler = async () => {
  if (cachedHandler) {
    return cachedHandler;
  }

  const { app } = await createApp({ enableRequestLogging: false });
  cachedHandler = serverlessExpress({ app });
  return cachedHandler;
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback,
) => {
  const lambdaHandler = await getHandler();
  return lambdaHandler(event, context, callback);
};
