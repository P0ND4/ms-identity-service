import { HttpStatus } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { OAuthProfile } from 'src/contexts/iam/domain/use-cases/auth/auth-use-case.interface';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

type AppleIdTokenPayload = {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  email_verified?: string;
  auth_time: number;
  nonce_supported?: boolean;
  real_user_status?: number;
};

type VerifyAppleIdTokenParams = {
  idToken: string;
  audience: string;
};

export async function verifyAppleIdTokenAndBuildOAuthProfile(
  params: VerifyAppleIdTokenParams,
): Promise<OAuthProfile> {
  const { idToken, audience } = params;

  if (!idToken) {
    throw new FoodaException(
      FoodaExceptionCodes.Ex1101,
      HttpStatus.BAD_REQUEST,
    );
  }

  if (typeof idToken !== 'string') {
    throw new FoodaException(
      FoodaExceptionCodes.Ex1100,
      HttpStatus.BAD_REQUEST,
    );
  }

  try {
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1099,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const payload = decoded.payload as AppleIdTokenPayload;

    if (payload.aud !== audience) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1099,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1099,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!payload.sub || !payload.email) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1099,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const emailVerified = payload.email_verified === 'true';

    return {
      provider: 'apple',
      providerAccountId: payload.sub,
      email: payload.email,
      firstName: 'Apple',
      lastName: 'User',
      avatarUrl: undefined,
      metadata: {
        providerRawProfile: payload,
        emailVerified,
      },
    };
  } catch (error) {
    if (error instanceof FoodaException) throw error;

    throw new FoodaException(
      FoodaExceptionCodes.Ex1099,
      HttpStatus.UNAUTHORIZED,
    );
  }
}
