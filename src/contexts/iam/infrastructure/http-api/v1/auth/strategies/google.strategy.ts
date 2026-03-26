import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    const clientID =
      configService.get<string>('GOOGLE_CLIENT_ID') ?? 'google-disabled';
    const clientSecret =
      configService.get<string>('GOOGLE_CLIENT_SECRET') ?? 'google-disabled';

    super({
      clientID,
      clientSecret,
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ??
        `http://localhost:${configService.get<number>('PORT') ?? 3000}/api/v1/iam/auth/login/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const email = profile?.emails?.[0]?.value;

    return {
      provider: 'google',
      providerAccountId: profile.id,
      email,
      firstName: profile.name?.givenName ?? profile.displayName ?? 'Google',
      lastName: profile.name?.familyName ?? 'User',
      avatarUrl: profile.photos?.[0]?.value,
      accessToken,
      refreshToken,
      metadata: {
        providerRawProfile: profile,
      },
    };
  }
}
