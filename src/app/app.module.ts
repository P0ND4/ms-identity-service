import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { databaseConfig } from 'src/config/database.config';
import { IamContextModule } from 'src/contexts/iam/infrastructure/iam.module';
import environment from 'src/config/environment.config';
import { TenantModule } from 'src/contexts/shared/infrastructure/tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environment],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        databaseConfig(configService),
    }),
    TenantModule,
    IamContextModule,
  ],
})
export class AppModule {}
