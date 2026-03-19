import { env } from './config/env';
import { createApp } from './app';

const bootstrap = async () => {
  const { app } = await createApp();

  app.listen(env.port, () => {
    console.log(`ChatRoom backend listening on http://localhost:${env.port}`);
  });
};

void bootstrap();
