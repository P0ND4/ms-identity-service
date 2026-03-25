import 'dotenv/config';

interface Environment {
  REDIS_URL?: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_USERNAME?: string;
  NODE_ENV: string;
  PORT: number;
  DB_HOST?: string;
  DB_PORT: number;
  DB_USERNAME?: string;
  DB_PASSWORD?: string;
  DB_DATABASE?: string;
  DB_SCHEMA: string;
  DB_SYNCHRONIZE: boolean;
  DB_SSL: boolean;
  DB_POOL_MAX: number;
  DB_POOL_MIN: number;
  DB_LOGGING: boolean;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_EXPIRES_IN_SECONDS: number;
  BLACKLIST_TTL_SECONDS: number;
  REFRESH_TOKEN_TTL_SECONDS: number;
}

export default async (): Promise<Environment> => {
  // Here you can use the ms-config-service and change the environment.
  // Compatible with async await by default.
  // If you're going to use asynchronous requests for environment variables, remember to use caching or ms-cache-service.

  return {
    // Redis
    REDIS_URL: process.env.REDIS_URL,
    REDIS_HOST: process.env.REDIS_HOST ?? 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_USERNAME: process.env.REDIS_USERNAME,
    BLACKLIST_TTL_SECONDS: parseInt(
      process.env.BLACKLIST_TTL_SECONDS ?? '604800',
      10,
    ),
    REFRESH_TOKEN_TTL_SECONDS: parseInt(
      process.env.REFRESH_TOKEN_TTL_SECONDS ?? '604800',
      10,
    ),

    // Database
    DB_HOST: process.env.DB_HOST,
    DB_PORT: parseInt(process.env.DB_PORT ?? '5432', 10),
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_DATABASE: process.env.DB_DATABASE,
    DB_SCHEMA: process.env.DB_SCHEMA ?? 'public',
    DB_SYNCHRONIZE: process.env.DB_SYNCHRONIZE === 'true',
    DB_SSL: process.env.DB_SSL === 'true',
    DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX ?? '10', 10),
    DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN ?? '2', 10),
    DB_LOGGING: process.env.DB_LOGGING === 'true',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET ?? 'secret',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1h',
    JWT_EXPIRES_IN_SECONDS: parseInt(
      process.env.JWT_EXPIRES_IN_SECONDS ?? '3600',
      10,
    ),

    // Server
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: parseInt(process.env.PORT ?? '3000', 10),
  };
};
