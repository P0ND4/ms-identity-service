import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import environment from 'src/config/environment.config';

@Injectable()
export class TokenBlacklistService {
  constructor(@Inject('TOKEN_BLACKLIST') private readonly redis: Redis) {}

  async addToBlacklist(token: string, expiresIn?: number): Promise<void> {
    const env = await environment();

    const key = `blacklist:${token}`;
    const ttl = expiresIn ?? env.BLACKLIST_TTL_SECONDS;
    await this.redis.setex(key, ttl, 'revoked');
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
