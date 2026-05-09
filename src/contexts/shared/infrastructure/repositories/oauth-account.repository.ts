import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import {
  OAuthAccount,
  OAuthProvider,
} from '../../domain/entities/oauth-account.entity';
import { IOAuthAccountRepository } from '../../domain/repositories/oauth-account.repository.interface';
import { TenantContext } from '../tenant/tenant-context.service';

@Injectable()
export class TypeOrmOAuthAccountRepository
  extends TypeOrmRepository<OAuthAccount>
  implements IOAuthAccountRepository
{
  constructor(
    @InjectRepository(OAuthAccount)
    repository: Repository<OAuthAccount>,
    tenantContext: TenantContext,
    dataSource: DataSource,
  ) {
    super(repository, tenantContext, dataSource);
  }

  /* ------------------------------------------------------------------ */
  /*  Read helpers                                                      */
  /* ------------------------------------------------------------------ */

  async findByProviderAccount(
    provider: OAuthProvider,
    providerAccountId: string,
  ): Promise<OAuthAccount | null> {
    return this.withTenantQueryRunner((manager) =>
      manager.findOne(OAuthAccount, {
        where: { provider, providerAccountId },
        relations: { collaborator: true },
      }),
    );
  }

  /* ------------------------------------------------------------------ */
  /*  CUD operations                                                    */
  /* ------------------------------------------------------------------ */

  async save(entity: Partial<OAuthAccount>): Promise<OAuthAccount> {
    const oauthAccountsTable = this.tableName('oauth_accounts');
    const result = await this.repository.query(
      `INSERT INTO ${oauthAccountsTable} 
       (id, provider, provider_account_id, collaborator_id, access_token, refresh_token, expires_at, metadata, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        entity.provider,
        entity.providerAccountId,
        entity.collaboratorId,
        entity.accessToken,
        entity.refreshToken,
        entity.expiresAt,
        entity.metadata ? JSON.stringify(entity.metadata) : null,
      ],
    );
    return result[0] as unknown as OAuthAccount;
  }

  async update(
    id: string,
    entity: Partial<OAuthAccount>,
  ): Promise<OAuthAccount> {
    const oauthAccountsTable = this.tableName('oauth_accounts');
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (entity.accessToken !== undefined) {
      setClauses.push(`access_token = $${paramIndex++}`);
      values.push(entity.accessToken);
    }
    if (entity.refreshToken !== undefined) {
      setClauses.push(`refresh_token = $${paramIndex++}`);
      values.push(entity.refreshToken);
    }
    if (entity.metadata !== undefined) {
      setClauses.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(entity.metadata));
    }

    if (setClauses.length > 0) {
      values.push(id);
      await this.repository.query(
        `UPDATE ${oauthAccountsTable} SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
        values,
      );
    }

    return (await this.findById(id))!;
  }
}
