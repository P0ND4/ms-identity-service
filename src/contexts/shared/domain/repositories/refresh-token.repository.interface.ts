import { IRepository } from './repository.interface';
import { RefreshToken } from '../entities/refresh-token.entity';

export abstract class IRefreshTokenRepository extends IRepository<RefreshToken> {
  abstract findByTokenHash(hash: string): Promise<RefreshToken | null>;
  abstract revoke(id: string): Promise<void>;
  abstract revokeAllByUser(userId: string): Promise<void>;
  abstract deleteExpired(): Promise<void>;
}
