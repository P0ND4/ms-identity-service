import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from 'src/config/database.config';
import { IamModule } from 'src/contexts/iam/infrastructure/iam.module';
import environment from 'src/config/environment.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environment],
    }),
    TypeOrmModule.forRootAsync({ useFactory: databaseConfig }),
    IamModule,
  ],
})
export class AppModule {}
