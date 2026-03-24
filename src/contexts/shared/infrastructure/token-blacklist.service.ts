// import { Injectable, Inject } from '@nestjs/common';
// import { Redis } from 'ioredis';
// import { BLACKLIST_TTL_SECONDS } from '../constants/jwt.constants';

// @Injectable()
// export class TokenBlacklistService {
//   constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

//   /**
//    * Adds a token to the blacklist
//    * @param token - The JWT token to invalidate
//    * @param expiresIn - Expiration time in seconds (default matches JWT expiration)
//    */
//   async addToBlacklist(
//     token: string,
//     expiresIn: number = BLACKLIST_TTL_SECONDS,
//   ): Promise<void> {
//     const key = `blacklist:${token}`;
//     await this.redis.setex(key, expiresIn, 'revoked');
//   }

//   /**
//    * Checks if a token is blacklisted
//    * @param token - The JWT token to verify
//    * @returns true if the token is invalidated
//    */
//   async isBlacklisted(token: string): Promise<boolean> {
//     const key = `blacklist:${token}`;
//     const result = await this.redis.get(key);
//     return result !== null;
//   }

//   /**
//    * Removes a token from the blacklist (uncommon, but useful for testing)
//    * @param token - The JWT token to remove
//    */
//   async removeFromBlacklist(token: string): Promise<void> {
//     const key = `blacklist:${token}`;
//     await this.redis.del(key);
//   }

//   /**
//    * Clears all tokens from the blacklist (useful for maintenance)
//    */
//   async clearAll(): Promise<void> {
//     const keys = await this.redis.keys('blacklist:*');
//     if (keys.length > 0) await this.redis.del(...keys);
//   }
// }
