import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from 'src/contexts/iam/application/auth/auth.use-case';
import { IAuthUseCase } from 'src/contexts/iam/domain/use-cases/auth-use-case.interface';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [
    {
      provide: IAuthUseCase,
      useClass: AuthService,
    },
  ],
  exports: [],
})
export class AuthModule {}
