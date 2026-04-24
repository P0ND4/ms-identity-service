import { Injectable, HttpStatus } from '@nestjs/common';
import * as jose from 'jose';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type ApplePublicJwk = {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
};

type CachedKeys = {
  keys: ApplePublicJwk[];
  fetchedAt: number;
};

@Injectable()
export class ApplePublicKeysService {
  private cache: CachedKeys | null = null;

  async getPublicKeys(): Promise<jose.JSONWebKeySet> {
    const now = Date.now();

    if (this.cache && now - this.cache.fetchedAt < CACHE_TTL_MS) {
      return { keys: this.cache.keys };
    }

    const response = await fetch(APPLE_KEYS_URL);
    if (!response.ok) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1102,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const keySet = (await response.json()) as jose.JSONWebKeySet;

    this.cache = {
      keys: keySet.keys as ApplePublicJwk[],
      fetchedAt: now,
    };

    return keySet;
  }

  async findKeyByKid(kid: string): Promise<ApplePublicJwk | null> {
    const keySet = await this.getPublicKeys();
    const found = keySet.keys.find((key) => key.kid === kid);
    if (!found) return null;
    return {
      kty: found.kty as string,
      kid: found.kid as string,
      use: found.use as string,
      alg: found.alg as string,
      n: found.n as string,
      e: found.e as string,
    };
  }
}
