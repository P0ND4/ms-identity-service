import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from 'src/contexts/iam/application/auth/auth.use-case';
import { IAuthUseCase } from 'src/contexts/iam/domain/use-cases/auth-use-case.interface';
import { BcryptService } from 'src/contexts/shared/infrastructure/hashing/bcrypt.service';
import { TokenBlacklistService } from 'src/contexts/shared/infrastructure/token-blacklist.service';
import { RedisModule } from 'src/database/redis.module';
import { IHashing } from 'src/contexts/shared/domain/interfaces/hashing.interface';
import { SharedModule } from 'src/contexts/shared/shared.module';
import { jwtConfig } from '../../../configuration/jwt.config';

@Module({
  imports: [
    RedisModule,
    SharedModule,
    JwtModule.registerAsync({ useFactory: async () => await jwtConfig() }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: IAuthUseCase,
      useClass: AuthService,
    },
    {
      provide: IHashing,
      useClass: BcryptService,
    },
    TokenBlacklistService,
  ],
  exports: [IAuthUseCase],
})
export class AuthModule {}
