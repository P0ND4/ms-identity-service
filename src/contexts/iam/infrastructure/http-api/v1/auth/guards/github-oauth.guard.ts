import { Injectable, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

@Injectable()
export class GithubOAuthGuard extends AuthGuard('github') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const enabled =
      this.configService.get<boolean>('ENABLE_GITHUB_OAUTH_REDIRECT') ?? false;

    if (!enabled) {
      throw new FoodaException(FoodaExceptionCodes.Ex1090, 404);
    }

    return super.canActivate(context) as boolean;
  }
}
