import { Module } from '@nestjs/common';
import { IamModule } from 'src/contexts/iam/infrastructure/iam.module';

@Module({
  imports: [IamModule],
})
export class AppModule {}
