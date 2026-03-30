import { HttpStatus } from '@nestjs/common';
import { OAuthProfile } from 'src/contexts/iam/domain/use-cases/auth/auth-use-case.interface';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

type SlackProfileResponse = {
  ok?: boolean;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image_192?: string;
    image_512?: string;
  };
};

export async function fetchSlackOAuthProfile(
  accessToken: string,
): Promise<OAuthProfile> {
  if (!accessToken) {
    throw new FoodaException(
      FoodaExceptionCodes.Ex1017,
      HttpStatus.BAD_REQUEST,
    );
  }

  try {
    const response = await fetch('https://slack.com/api/users.identity', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1019,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const payload = (await response.json()) as SlackProfileResponse;

    if (!payload.ok || !payload.user?.id || !payload.user?.email) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1019,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      provider: 'slack',
      providerAccountId: payload.user.id,
      email: payload.user.email,
      firstName: payload.user.name ?? 'Slack',
      lastName: 'User',
      avatarUrl: payload.user.image_512 ?? payload.user.image_192,
      accessToken,
      metadata: {
        providerRawProfile: payload,
      },
    };
  } catch (error) {
    if (error instanceof FoodaException) throw error;

    throw new FoodaException(
      FoodaExceptionCodes.Ex1019,
      HttpStatus.UNAUTHORIZED,
    );
  }
}
