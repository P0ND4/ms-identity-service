import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-slack-oauth2';

@Injectable()
export class SlackStrategy extends PassportStrategy(Strategy, 'slack') {
  constructor(private readonly configService: ConfigService) {
    const clientID =
      configService.get<string>('SLACK_CLIENT_ID') ?? 'slack-disabled';
    const clientSecret =
      configService.get<string>('SLACK_CLIENT_SECRET') ?? 'slack-disabled';

    super({
      clientID,
      clientSecret,
      callbackURL:
        configService.get<string>('SLACK_CALLBACK_URL') ??
        `http://localhost:${configService.get<number>('PORT') ?? 3000}/api/v1/iam/auth/login/slack/callback`,
      scope: ['identity.basic', 'identity.email', 'identity.avatar'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const email =
      profile?.emails?.[0]?.value ??
      profile?.user?.email ??
      profile?._json?.email;

    const displayName = profile?.displayName ?? profile?.user?.name ?? 'Slack';

    return {
      provider: 'slack',
      providerAccountId: profile.id,
      email,
      firstName: displayName,
      lastName: 'User',
      avatarUrl:
        profile?.photos?.[0]?.value ??
        profile?.user?.image_192 ??
        profile?.user?.image_512,
      accessToken,
      refreshToken,
      metadata: {
        providerRawProfile: profile,
      },
    };
  }
}
