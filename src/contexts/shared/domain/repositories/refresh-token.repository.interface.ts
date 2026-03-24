import { IRepository } from './repository.interface';
import { RefreshToken } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository extends IRepository<RefreshToken> {
  findByTokenHash(hash: string): Promise<RefreshToken | null>;
  revoke(id: string): Promise<void>;
  revokeAllByUser(userId: string): Promise<void>;
  deleteExpired(): Promise<void>;
}
