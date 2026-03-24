import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';

@Injectable()
export class TypeOrmRefreshTokenRepository
  extends TypeOrmRepository<RefreshToken>
  implements IRefreshTokenRepository
{
  constructor(
    @InjectRepository(RefreshToken)
    repository: Repository<RefreshToken>,
  ) {
    super(repository);
  }

  async findByTokenHash(hash: string): Promise<RefreshToken | null> {
    return await this.repository.findOne({ where: { tokenHash: hash } });
  }

  async revoke(id: string): Promise<void> {
    await this.repository.update(id, { revokedAt: new Date() });
  }

  async revokeAllByUser(userId: string): Promise<void> {
    await this.repository.update(
      { collaboratorId: userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async deleteExpired(): Promise<void> {
    await this.repository.delete({
      expiresAt: LessThan(new Date()),
      revokedAt: IsNull(),
    });
  }
}
