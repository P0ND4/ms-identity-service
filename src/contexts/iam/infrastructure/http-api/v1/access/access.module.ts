import { Module } from '@nestjs/common';
import { AccessController } from './controllers/access.controller';
import { SharedModule } from 'src/contexts/shared/shared.module';
import { AccessService } from 'src/contexts/iam/application/access/acess.use-case';
import { IAccessUseCase } from 'src/contexts/iam/domain/use-cases/access-use-case.interface';

@Module({
  imports: [SharedModule],
  controllers: [AccessController],
  providers: [
    {
      provide: IAccessUseCase,
      useClass: AccessService,
    },
  ],
  exports: [IAccessUseCase],
})
export class AccessModule {}
