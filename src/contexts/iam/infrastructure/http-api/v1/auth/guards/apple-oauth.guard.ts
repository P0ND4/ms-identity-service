import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

@Injectable()
export class AppleOAuthGuard extends AuthGuard('apple') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const enabled =
      this.configService.get<boolean>('ENABLE_APPLE_OAUTH_REDIRECT') ?? false;

    if (!enabled) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1096,
        HttpStatus.NOT_FOUND,
      );
    }

    return super.canActivate(context);
  }
}
