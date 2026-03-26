import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  // Currently, this is using PostgreSQL as the database, but you can use whichever one best suits your needs.
  // You can edit the environments file to change the database configuration (./environment.config.ts)
  // You can change the entities if you need to (./src/contexts/shared/domain/entities)
  // If you are going to use a different database, remember to remove the "pg" package.

  const entities = [__dirname + '/../**/*.entity{.ts,.js}'];

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT') ?? 5432,
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
    schema: configService.get<string>('DB_SCHEMA') ?? 'public',
    entities,
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE') ?? false,
    extra: {
      ssl: configService.get<boolean>('DB_SSL')
        ? { rejectUnauthorized: false }
        : false,
      max: configService.get<number>('DB_POOL_MAX') ?? 10,
      min: configService.get<number>('DB_POOL_MIN') ?? 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    logging: configService.get<boolean>('DB_LOGGING')
      ? ['query', 'error']
      : ['error'],
  };
};
