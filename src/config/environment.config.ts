interface Environment {
  REDIS_URL?: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_USERNAME?: string;
  NODE_ENV: string;
  PORT: number;
}

export default async (): Promise<Environment> => {
  // Here you can use the ms-config-service and change the environment.
  // Compatible with async await by default.
  // If you're going to use asynchronous requests for environment variables, remember to use caching or ms-cache-service.

  return {
    REDIS_URL: process.env.REDIS_URL,
    REDIS_HOST: process.env.REDIS_HOST ?? 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_USERNAME: process.env.REDIS_USERNAME,
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: parseInt(process.env.PORT ?? '3000', 10),
  };
};
