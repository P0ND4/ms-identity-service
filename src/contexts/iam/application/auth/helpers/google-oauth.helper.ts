import { HttpStatus } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { OAuthProfile } from 'src/contexts/iam/domain/use-cases/auth/auth-use-case.interface';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

type VerifyGoogleIdTokenParams = {
  idToken: string;
  audience: string;
  googleOAuthClient: OAuth2Client;
};

export async function verifyGoogleIdTokenAndBuildOAuthProfile(
  params: VerifyGoogleIdTokenParams,
): Promise<OAuthProfile> {
  const { idToken, audience, googleOAuthClient } = params;

  if (!idToken) {
    throw new FoodaException(
      FoodaExceptionCodes.Ex1011,
      HttpStatus.BAD_REQUEST,
    );
  }

  try {
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken,
      audience,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload?.email || !payload?.email_verified) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1013,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      provider: 'google',
      providerAccountId: payload.sub,
      email: payload.email,
      firstName: payload.given_name ?? payload.name ?? 'Google',
      lastName: payload.family_name ?? 'User',
      avatarUrl: payload.picture,
      metadata: {
        providerRawProfile: payload,
      },
    };
  } catch (error) {
    if (error instanceof FoodaException) throw error;

    throw new FoodaException(
      FoodaExceptionCodes.Ex1013,
      HttpStatus.UNAUTHORIZED,
    );
  }
}
