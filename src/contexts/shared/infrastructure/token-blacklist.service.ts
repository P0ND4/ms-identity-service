import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

const BLACKLIST_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 dias

@Injectable()
export class TokenBlacklistService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async addToBlacklist(
    token: string,
    expiresIn: number = BLACKLIST_TTL_SECONDS,
  ): Promise<void> {
    const key = `blacklist:${token}`;
    await this.redis.setex(key, expiresIn, 'revoked');
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.redis.get(key);
    return result !== null;
  }

  async removeFromBlacklist(token: string): Promise<void> {
    const key = `blacklist:${token}`;
    await this.redis.del(key);
  }

  async clearAll(): Promise<void> {
    const keys = await this.redis.keys('blacklist:*');
    if (keys.length > 0) await this.redis.del(...keys);
  }
}
