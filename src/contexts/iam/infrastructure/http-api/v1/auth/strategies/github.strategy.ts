import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';
import { OAuthProfile } from 'src/contexts/iam/domain/use-cases/auth/auth-use-case.interface';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GITHUB_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new FoodaException(FoodaExceptionCodes.Ex1012, 500);
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ): Promise<OAuthProfile> {
    const email =
      profile.emails?.find((e: any) => e.primary)?.value ??
      profile.emails?.[0]?.value;

    if (!email) throw new FoodaException(FoodaExceptionCodes.Ex1028, 400);

    return {
      provider: 'github',
      providerAccountId: profile.id,
      email: email,
      firstName: profile.name?.givenName ?? 'Github',
      lastName: profile.name?.familyName ?? 'User',
      avatarUrl: profile.photos?.[0]?.value,
      accessToken: _accessToken,
      refreshToken: _refreshToken,
      metadata: {
        providerRawProfile: profile,
      },
    };
  }
}
