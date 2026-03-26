import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/fooda.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const enabled =
      this.configService.get<boolean>('ENABLE_GOOGLE_OAUTH_REDIRECT') ?? false;

    if (!enabled) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1020,
        HttpStatus.NOT_FOUND,
      );
    }

    return super.canActivate(context);
  }
}
