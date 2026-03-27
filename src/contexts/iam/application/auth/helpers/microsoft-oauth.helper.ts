import { HttpStatus } from '@nestjs/common';
import { OAuthProfile } from 'src/contexts/iam/domain/use-cases/auth/auth-use-case.interface';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/fooda.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

type MicrosoftProfileResponse = {
  id?: string;
  mail?: string;
  userPrincipalName?: string;
  givenName?: string;
  surname?: string;
  displayName?: string;
};

export async function fetchMicrosoftOAuthProfile(
  accessToken: string,
): Promise<OAuthProfile> {
  if (!accessToken) {
    throw new FoodaException(
      FoodaExceptionCodes.Ex1015,
      HttpStatus.BAD_REQUEST,
    );
  }

  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1018,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const payload = (await response.json()) as MicrosoftProfileResponse;
    const email = payload.mail ?? payload.userPrincipalName;

    if (!payload.id || !email) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1018,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      provider: 'microsoft',
      providerAccountId: payload.id,
      email,
      firstName: payload.givenName ?? payload.displayName ?? 'Microsoft',
      lastName: payload.surname ?? 'User',
      accessToken,
      metadata: {
        providerRawProfile: payload,
      },
    };
  } catch (error) {
    if (error instanceof FoodaException) throw error;

    throw new FoodaException(
      FoodaExceptionCodes.Ex1018,
      HttpStatus.UNAUTHORIZED,
    );
  }
}
