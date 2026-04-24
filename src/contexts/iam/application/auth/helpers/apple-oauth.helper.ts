import { HttpStatus } from '@nestjs/common';
import * as jose from 'jose';
import { OAuthProfile } from 'src/contexts/iam/domain/use-cases/auth/auth-use-case.interface';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';
import { ApplePublicKeysService } from './apple-public-keys.service';

type AppleIdTokenPayload = {
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  email_verified?: string;
  auth_time: number;
  nonce_supported?: boolean;
  real_user_status?: number;
  nonce?: string;
};

type VerifyAppleIdTokenParams = {
  idToken: string;
  audience: string;
  nonce?: string;
};

const APPLE_ISSUER = 'https://appleid.apple.com';

export function createAppleTokenVerifier(
  appleKeysService: ApplePublicKeysService,
) {
  return async function verifyAppleIdTokenAndBuildOAuthProfile(
    params: VerifyAppleIdTokenParams,
  ): Promise<OAuthProfile> {
    const { idToken, audience, nonce } = params;

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
      const header = jose.decodeProtectedHeader(idToken);

      if (!header.kid) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1103,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const publicKey = await appleKeysService.findKeyByKid(header.kid);
      if (!publicKey) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1104,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const verified = await jose.jwtVerify(idToken, publicKey, {
        issuer: APPLE_ISSUER,
        audience: audience,
      });

      const payload = verified.payload as unknown as AppleIdTokenPayload;

      if (nonce && payload.nonce !== nonce) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1105,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const aud =
        typeof payload.aud === 'string' ? payload.aud : payload.aud[0];
      if (aud !== audience) {
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

      const email = payload.email ?? '';
      const hasEmail = !!email;

      const emailVerified = payload.email_verified === 'true';
      const isAppleRelayEmail = email.endsWith('@privatemail.com');

      return {
        provider: 'apple',
        providerAccountId: payload.sub,
        email: email,
        firstName: 'Apple',
        lastName: 'User',
        avatarUrl: undefined,
        metadata: {
          providerRawProfile: payload,
          emailVerified,
          isAppleRelayEmail,
          hasEmail,
        },
      };
    } catch (error) {
      if (error instanceof FoodaException) throw error;

      throw new FoodaException(
        FoodaExceptionCodes.Ex1099,
        HttpStatus.UNAUTHORIZED,
      );
    }
  };
}

export async function verifyAppleIdTokenAndBuildOAuthProfile(
  params: VerifyAppleIdTokenParams,
): Promise<OAuthProfile> {
  const { idToken, audience, nonce } = params;

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
    const header = jose.decodeProtectedHeader(idToken);

    if (!header.kid) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1103,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const keysUrl = 'https://appleid.apple.com/auth/keys';
    const response = await fetch(keysUrl);
    if (!response.ok) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1102,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const keySet = (await response.json()) as jose.JSONWebKeySet;
    const publicKey = keySet.keys.find((key) => key.kid === header.kid);
    if (!publicKey) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1104,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const verified = await jose.jwtVerify(idToken, publicKey, {
      issuer: APPLE_ISSUER,
      audience: audience,
    });

    const payload = verified.payload as unknown as AppleIdTokenPayload;

    if (nonce && payload.nonce !== nonce) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1105,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const aud = typeof payload.aud === 'string' ? payload.aud : payload.aud[0];
    if (aud !== audience) {
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

    const email = payload.email ?? '';
    const hasEmail = !!email;
    const emailVerified = payload.email_verified === 'true';
    const isAppleRelayEmail = email.endsWith('@privatemail.com');

    return {
      provider: 'apple',
      providerAccountId: payload.sub,
      email: email,
      firstName: 'Apple',
      lastName: 'User',
      avatarUrl: undefined,
      metadata: {
        providerRawProfile: payload,
        emailVerified,
        isAppleRelayEmail,
        hasEmail,
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
