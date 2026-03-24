import { Module } from '@nestjs/common';
import { Redis } from 'ioredis';
import environment from 'src/config/environment.config';

const createRedisClient = async (clientName: string): Promise<Redis> => {
  const env = await environment();

  const host = env.REDIS_HOST;
  const port = env.REDIS_PORT;
  const password = env.REDIS_PASSWORD;
  const username = env.REDIS_USERNAME;
  const redisUrl = env.REDIS_URL;

  const client = redisUrl
    ? new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false })
    : new Redis({
        host,
        port,
        password,
        username,
        maxRetriesPerRequest: 3,
        lazyConnect: false,
      });

  client.on('error', (err) => {
    console.error(`[${clientName}] Connection error:`, err.message);
  });

  client.on('connect', () => {
    const connectionString = redisUrl || `${host}:${port}`;
    console.log(`[${clientName}] Connected to ${connectionString}`);
  });

  return client;
};

@Module({
  providers: [
    {
      provide: 'TOKEN_BLACKLIST',
      useFactory: async () => await createRedisClient('Token Blacklist'),
    },
  ],
  exports: ['TOKEN_BLACKLIST'],
})
export class RedisModule {}
