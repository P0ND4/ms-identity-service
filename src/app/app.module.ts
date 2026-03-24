import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from 'src/config/database.config';
import { IamModule } from 'src/contexts/iam/infrastructure/iam.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: databaseConfig }),
    IamModule,
  ],
})
export class AppModule {}
