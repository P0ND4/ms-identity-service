import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private readonly configService: ConfigService) {
    const clientID =
      configService.get<string>('APPLE_CLIENT_ID') ?? 'apple-disabled';
    const teamID =
      configService.get<string>('APPLE_TEAM_ID') ?? 'apple-disabled';
    const keyID = configService.get<string>('APPLE_KEY_ID') ?? 'apple-disabled';
    const privateKey =
      configService.get<string>('APPLE_PRIVATE_KEY') ?? 'apple-disabled';

    super({
      clientID,
      teamID,
      keyID,
      privateKeyString: privateKey,
      callbackURL:
        configService.get<string>('APPLE_CALLBACK_URL') ??
        `http://localhost:${configService.get<number>('PORT') ?? 3000}/api/v1/iam/auth/login/apple/callback`,
      scope: ['email', 'name'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const email = profile?.email ?? profile?._json?.email;

    return {
      provider: 'apple',
      providerAccountId: profile.id,
      email: email,
      firstName:
        profile.name?.firstName ?? profile?._json?.name?.firstName ?? 'Apple',
      lastName:
        profile.name?.lastName ?? profile?._json?.name?.lastName ?? 'User',
      avatarUrl: undefined,
      accessToken,
      refreshToken,
      metadata: {
        providerRawProfile: profile,
      },
    };
  }
}
