import { Module } from '@nestjs/common';
import { CollaboratorsController } from './controllers/collaborators.controller';
import { SharedModule } from 'src/contexts/shared/shared.module';
import { CollaboratorsService } from 'src/contexts/iam/application/collaborators/collaborators.use-case';
import { ICollaboratorsUseCase } from 'src/contexts/iam/domain/use-cases/collaborators/collaborators-use-case.interface';
import { IHashing } from 'src/contexts/shared/domain/interfaces/hashing.interface';
import { BcryptService } from 'src/contexts/shared/infrastructure/hashing/bcrypt.service';

@Module({
  imports: [SharedModule],
  controllers: [CollaboratorsController],
  providers: [
    {
      provide: ICollaboratorsUseCase,
      useClass: CollaboratorsService,
    },
    {
      provide: IHashing,
      useClass: BcryptService,
    },
  ],
  exports: [ICollaboratorsUseCase],
})
export class CollaboratorsModule {}
