import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(private readonly configService: ConfigService) {
    const clientID =
      configService.get<string>('MICROSOFT_CLIENT_ID') ?? 'microsoft-disabled';
    const clientSecret =
      configService.get<string>('MICROSOFT_CLIENT_SECRET') ??
      'microsoft-disabled';

    super({
      clientID,
      clientSecret,
      callbackURL:
        configService.get<string>('MICROSOFT_CALLBACK_URL') ??
        `http://localhost:${configService.get<number>('PORT') ?? 3000}/api/v1/iam/auth/login/microsoft/callback`,
      scope: ['user.read'],
      tenant: configService.get<string>('MICROSOFT_TENANT_ID') ?? 'common',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const email =
      profile?.emails?.[0]?.value ??
      profile?._json?.mail ??
      profile?._json?.userPrincipalName;

    return {
      provider: 'microsoft',
      providerAccountId: profile.id,
      email,
      firstName:
        profile.name?.givenName ?? profile.displayName?.split(' ')?.[0] ?? 'MS',
      lastName:
        profile.name?.familyName ??
        profile.displayName?.split(' ')?.slice(1).join(' ') ??
        'User',
      avatarUrl: profile.photos?.[0]?.value,
      accessToken,
      refreshToken,
      metadata: {
        providerRawProfile: profile,
      },
    };
  }
}
