import { Module } from '@nestjs/common';
import { CollaboratorsController } from './controllers/collaborators.controller';

@Module({
  imports: [],
  controllers: [CollaboratorsController],
  providers: [],
  exports: [],
})
export class CollaboratorsModule {}
