import { Module } from '@nestjs/common';
import { AccessController } from './controllers/access.controller';

@Module({
  imports: [],
  controllers: [AccessController],
  providers: [],
  exports: [],
})
export class AccessModule {}
