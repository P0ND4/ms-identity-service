import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { TenantContext } from '../tenant/tenant-context.service';

@Injectable()
export class TypeOrmRefreshTokenRepository
  extends TypeOrmRepository<RefreshToken>
  implements IRefreshTokenRepository
{
  constructor(
    @InjectRepository(RefreshToken)
    repository: Repository<RefreshToken>,
    tenantContext: TenantContext,
    dataSource: DataSource,
  ) {
    super(repository, tenantContext, dataSource);
  }

  /* ------------------------------------------------------------------ */
  /*  Read helpers                                                      */
  /* ------------------------------------------------------------------ */

  async findByTokenHash(hash: string): Promise<RefreshToken | null> {
    return this.withTenantQueryRunner((manager) =>
      manager.findOne(RefreshToken, { where: { tokenHash: hash } }),
    );
  }

  /* ------------------------------------------------------------------ */
  /*  CUD operations                                                    */
  /* ------------------------------------------------------------------ */

  async save(entity: Partial<RefreshToken>): Promise<RefreshToken> {
    const refreshTokensTable = this.tableName('refresh_tokens');
    const result = await this.repository.query(
      `INSERT INTO ${refreshTokensTable} 
       (id, token_hash, collaborator_id, expires_at, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       RETURNING *`,
      [entity.tokenHash, entity.collaboratorId, entity.expiresAt],
    );
    return result[0] as unknown as RefreshToken;
  }

  async update(
    id: string,
    entity: Partial<RefreshToken>,
  ): Promise<RefreshToken> {
    const refreshTokensTable = this.tableName('refresh_tokens');
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (entity.revokedAt !== undefined) {
      setClauses.push(`revoked_at = $${paramIndex++}`);
      values.push(entity.revokedAt);
    }

    if (setClauses.length > 0) {
      values.push(id);
      await this.repository.query(
        `UPDATE ${refreshTokensTable} SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
        values,
      );
    }

    return (await this.findById(id))!;
  }

  /* ------------------------------------------------------------------ */
  /*  Token management                                                  */
  /* ------------------------------------------------------------------ */

  async revoke(id: string): Promise<void> {
    const refreshTokensTable = this.tableName('refresh_tokens');
    await this.repository.query(
      `UPDATE ${refreshTokensTable} SET revoked_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  async revokeAllByUser(userId: string): Promise<void> {
    const refreshTokensTable = this.tableName('refresh_tokens');
    await this.repository.query(
      `UPDATE ${refreshTokensTable} SET revoked_at = NOW() WHERE collaborator_id = $1 AND revoked_at IS NULL`,
      [userId],
    );
  }

  async deleteExpired(): Promise<void> {
    const refreshTokensTable = this.tableName('refresh_tokens');
    await this.repository.query(
      `UPDATE ${refreshTokensTable} SET deleted_at = NOW() WHERE expires_at < NOW() AND revoked_at IS NULL`,
    );
  }
}
