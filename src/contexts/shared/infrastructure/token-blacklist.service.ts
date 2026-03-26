import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class TokenBlacklistService {
  constructor(
    @Inject('TOKEN_BLACKLIST') private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  async addToBlacklist(token: string, expiresIn?: number): Promise<void> {
    const key = `blacklist:${token}`;
    const ttl =
      expiresIn ??
      this.configService.get<number>('BLACKLIST_TTL_SECONDS') ??
      604800;
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
