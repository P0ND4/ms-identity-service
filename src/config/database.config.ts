import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import environment from './environment.config';

export const databaseConfig = async (): Promise<TypeOrmModuleOptions> => {
  // Currently, this is using PostgreSQL as the database, but you can use whichever one best suits your needs.
  // You can edit the environments file to change the database configuration (./environment.config.ts)
  // You can change the entities if you need to (./src/contexts/shared/domain/entities)
  // If you are going to use a different database, remember to remove the "pg" package.

  const env = await environment();
  const entities = [__dirname + '/../**/*.entity{.ts,.js}'];

  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    schema: env.DB_SCHEMA,
    entities,
    synchronize: env.DB_SYNCHRONIZE,
    extra: {
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
      max: env.DB_POOL_MAX,
      min: env.DB_POOL_MIN,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    logging: env.DB_LOGGING ? ['query', 'error'] : ['error'],
  };
};
