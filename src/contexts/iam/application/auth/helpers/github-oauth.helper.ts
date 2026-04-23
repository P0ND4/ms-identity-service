import { HttpStatus } from '@nestjs/common';
import { OAuthProfile } from 'src/contexts/iam/domain/use-cases/auth/auth-use-case.interface';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

type GithubUserResponse = {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
  verified: boolean;
};

type GithubEmailsResponse = Array<{
  email: string;
  primary: boolean;
  verified: boolean;
}>;

export async function fetchGithubOAuthProfile(
  accessToken: string,
): Promise<OAuthProfile> {
  if (!accessToken) {
    throw new FoodaException(
      FoodaExceptionCodes.Ex1090,
      HttpStatus.BAD_REQUEST,
    );
  }

  try {
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1091,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userPayload = (await userResponse.json()) as GithubUserResponse;

    if (!userPayload.email || !userPayload.verified) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (emailsResponse.ok) {
        const emails = (await emailsResponse.json()) as GithubEmailsResponse;
        const primaryVerifiedEmail = emails.find(
          (e) => e.primary && e.verified,
        );

        if (primaryVerifiedEmail) {
          return buildOAuthProfile(
            userPayload,
            primaryVerifiedEmail.email,
            accessToken,
          );
        }
      }

      throw new FoodaException(
        FoodaExceptionCodes.Ex1092,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return buildOAuthProfile(userPayload, userPayload.email, accessToken);
  } catch (error) {
    if (error instanceof FoodaException) throw error;

    throw new FoodaException(
      FoodaExceptionCodes.Ex1091,
      HttpStatus.UNAUTHORIZED,
    );
  }
}

function buildOAuthProfile(
  user: GithubUserResponse,
  email: string,
  accessToken: string,
): OAuthProfile {
  const nameParts = (user.name ?? user.login).split(' ');
  const firstName = nameParts[0] ?? 'Github';
  const lastName = nameParts.slice(1).join(' ') || 'User';

  return {
    provider: 'github',
    providerAccountId: String(user.id),
    email: email,
    firstName: firstName,
    lastName: lastName,
    avatarUrl: user.avatar_url,
    accessToken,
    metadata: {
      providerRawProfile: user,
    },
  };
}
