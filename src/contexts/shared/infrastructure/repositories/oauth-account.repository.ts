import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    private readonly tenantContext: TenantContext,
  ) {
    super(repository);
  }

  private tableName(table: string): string {
    return `${this.tenantContext.schemaQuoted}.${table}`;
  }

  async findByProviderAccount(
    provider: OAuthProvider,
    providerAccountId: string,
  ): Promise<OAuthAccount | null> {
    return (await this.repository
      .createQueryBuilder('oa')
      .from(this.tableName('oauth_accounts'), 'oa')
      .leftJoinAndSelect('oa.collaborator', 'c')
      .where('oa.provider = :provider', { provider })
      .andWhere('oa.provider_account_id = :providerAccountId', {
        providerAccountId,
      })
      .getOne()) as unknown as OAuthAccount;
  }

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

    const result = await this.repository
      .createQueryBuilder('oa')
      .from(this.tableName('oauth_accounts'), 'oa')
      .where('oa.id = :id', { id })
      .getOne();
    return result as unknown as OAuthAccount;
  }

  async findById(id: string): Promise<OAuthAccount | null> {
    return (await this.repository
      .createQueryBuilder('oa')
      .from(this.tableName('oauth_accounts'), 'oa')
      .where('oa.id = :id', { id })
      .getOne()) as unknown as OAuthAccount;
  }

  async findAll(): Promise<OAuthAccount[]> {
    return (await this.repository
      .createQueryBuilder('oa')
      .from(this.tableName('oauth_accounts'), 'oa')
      .getMany()) as unknown as OAuthAccount[];
  }

  async delete(id: string): Promise<void> {
    const oauthAccountsTable = this.tableName('oauth_accounts');
    await this.repository.query(
      `DELETE FROM ${oauthAccountsTable} WHERE id = $1`,
      [id],
    );
  }

  async exists(id: string): Promise<boolean> {
    const oauthAccountsTable = this.tableName('oauth_accounts');
    const result = await this.repository.query(
      `SELECT COUNT(*) as count FROM ${oauthAccountsTable} WHERE id = $1`,
      [id],
    );
    return parseInt(result[0].count, 10) > 0;
  }
}
