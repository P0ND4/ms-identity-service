import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from 'src/contexts/iam/application/auth/auth.use-case';
import { IAuthUseCase } from 'src/contexts/iam/domain/use-cases/auth-use-case.interface';
import { BcryptService } from 'src/contexts/shared/infrastructure/hashing/bcrypt.service';
import { TokenBlacklistService } from 'src/contexts/shared/infrastructure/token-blacklist.service';
import { RedisModule } from 'src/database/redis.module';
import { IHashing } from 'src/contexts/shared/domain/interfaces/hashing.interface';
import { SharedModule } from 'src/contexts/shared/shared.module';
import { jwtConfig } from '../../../configuration/jwt.config';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftOAuthGuard } from './guards/microsoft-oauth.guard';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { SlackOAuthGuard } from './guards/slack-oauth.guard';
import { SlackStrategy } from './strategies/slack.strategy';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    RedisModule,
    SharedModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => jwtConfig(configService),
    }),
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
    GoogleOAuthGuard,
    GoogleStrategy,
    MicrosoftOAuthGuard,
    MicrosoftStrategy,
    SlackOAuthGuard,
    SlackStrategy,
  ],
  exports: [IAuthUseCase],
})
export class AuthModule {}
