import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import { Collaborator } from '../../domain/entities';
import { ICollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import { TenantContext } from '../tenant/tenant-context.service';

const COLLABORATOR_ROLES_RELATIONS = {
  collaboratorRoles: {
    role: {
      rolePermissions: {
        permission: true,
      },
    },
  },
};

@Injectable()
export class TypeOrmCollaboratorRepository
  extends TypeOrmRepository<Collaborator>
  implements ICollaboratorRepository
{
  constructor(
    @InjectRepository(Collaborator)
    repository: Repository<Collaborator>,
    tenantContext: TenantContext,
    dataSource: DataSource,
  ) {
    super(repository, tenantContext, dataSource);
  }

  /* ------------------------------------------------------------------ */
  /*  Read helpers (withTenantQueryRunner inherited from base)           */
  /* ------------------------------------------------------------------ */

  async findByEmail(email: string): Promise<Collaborator | null> {
    return this.withTenantQueryRunner((manager) =>
      manager.findOne(Collaborator, { where: { email } }),
    );
  }

  async findByEmails(emails: string[]): Promise<Collaborator[]> {
    if (emails.length === 0) return [];
    return this.withTenantQueryRunner((manager) =>
      manager.find(Collaborator, { where: { email: In(emails) } }),
    );
  }

  async findByIdsWithRoles(ids: string[]): Promise<Collaborator[]> {
    if (ids.length === 0) return [];
    return this.withTenantQueryRunner((manager) =>
      manager.find(Collaborator, {
        where: { id: In(ids) },
        relations: COLLABORATOR_ROLES_RELATIONS,
      }),
    );
  }

  async findByEmailWithRoles(email: string): Promise<Collaborator | null> {
    return this.withTenantQueryRunner((manager) =>
      manager.findOne(Collaborator, {
        where: { email },
        relations: COLLABORATOR_ROLES_RELATIONS,
      }),
    );
  }

  async findByIdWithRoles(id: string): Promise<Collaborator | null> {
    return this.withTenantQueryRunner((manager) =>
      manager.findOne(Collaborator, {
        where: { id },
        relations: COLLABORATOR_ROLES_RELATIONS,
      }),
    );
  }

  async findAllWithRoles(): Promise<Collaborator[]> {
    return this.withTenantQueryRunner((manager) =>
      manager.find(Collaborator, {
        relations: COLLABORATOR_ROLES_RELATIONS,
        order: { createdAt: 'ASC' },
      }),
    );
  }

  /* ------------------------------------------------------------------ */
  /*  CUD operations                                                    */
  /* ------------------------------------------------------------------ */

  async save(entity: Partial<Collaborator>): Promise<Collaborator> {
    const collaboratorTable = this.tableName('collaborators');
    const result = await this.repository.query(
      `INSERT INTO ${collaboratorTable} 
       (id, email, password_hash, first_name, last_name, avatar_url, email_verified, status, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        entity.email,
        entity.passwordHash,
        entity.firstName,
        entity.lastName,
        entity.avatarUrl,
        entity.emailVerified,
        entity.status,
      ],
    );
    return result[0] as Collaborator;
  }

  async update(
    id: string,
    entity: Partial<Collaborator>,
  ): Promise<Collaborator> {
    const collaboratorTable = this.tableName('collaborators');
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (entity.email !== undefined) {
      setClauses.push(`email = $${paramIndex++}`);
      values.push(entity.email);
    }
    if (entity.firstName !== undefined) {
      setClauses.push(`first_name = $${paramIndex++}`);
      values.push(entity.firstName);
    }
    if (entity.lastName !== undefined) {
      setClauses.push(`last_name = $${paramIndex++}`);
      values.push(entity.lastName);
    }
    if (entity.avatarUrl !== undefined) {
      setClauses.push(`avatar_url = $${paramIndex++}`);
      values.push(entity.avatarUrl);
    }
    if (entity.passwordHash !== undefined) {
      setClauses.push(`password_hash = $${paramIndex++}`);
      values.push(entity.passwordHash);
    }
    if (entity.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(entity.status);
    }

    if (setClauses.length > 0) {
      setClauses.push(`updated_at = NOW()`);
      values.push(id);
      await this.repository.query(
        `UPDATE ${collaboratorTable} SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
        values,
      );
    }

    return (await this.findById(id))!;
  }

  /** Soft-delete (Collaborator entity has @DeleteDateColumn). */
  async delete(id: string): Promise<void> {
    const collaboratorTable = this.tableName('collaborators');
    await this.repository.query(
      `UPDATE ${collaboratorTable} SET deleted_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  async existsByEmail(email: string): Promise<boolean> {
    const collaboratorTable = this.tableName('collaborators');
    const result = await this.repository.query(
      `SELECT COUNT(*) as count FROM ${collaboratorTable} WHERE email = $1`,
      [email],
    );
    return parseInt(result[0].count, 10) > 0;
  }

  /** Hard-delete — permanently removes the row from the database. */
  async permanentDelete(id: string): Promise<void> {
    const collaboratorTable = this.tableName('collaborators');
    await this.repository.query(
      `DELETE FROM ${collaboratorTable} WHERE id = $1`,
      [id],
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Bulk operations                                                   */
  /* ------------------------------------------------------------------ */

  async bulkCreateWithRoles(params: {
    collaborators: Array<{
      email: string;
      firstName: string;
      lastName: string;
      passwordHash: string;
      status: string;
      emailVerified: boolean;
      roleIds: string[];
      assignedBy?: string;
    }>;
  }): Promise<string[]> {
    return await this.repository.manager.transaction(async (manager) => {
      const createdIds: string[] = [];
      const collaboratorTable = this.tableName('collaborators');
      const collaboratorRoleTable = this.tableName('collaborator_roles');

      for (const collaborator of params.collaborators) {
        const result = await manager.query(
          `INSERT INTO ${collaboratorTable} 
           (id, email, password_hash, first_name, last_name, email_verified, status, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
           RETURNING id`,
          [
            collaborator.email,
            collaborator.passwordHash,
            collaborator.firstName,
            collaborator.lastName,
            collaborator.emailVerified,
            collaborator.status,
          ],
        );
        const createdId = result[0].id;

        if (collaborator.roleIds.length > 0) {
          const roleValues = collaborator.roleIds
            .map(
              (roleId) =>
                `('${createdId}', '${roleId}', '${collaborator.assignedBy || ''}', NOW())`,
            )
            .join(',');
          await manager.query(
            `INSERT INTO ${collaboratorRoleTable} (collaborator_id, role_id, assigned_by, assigned_at) VALUES ${roleValues}`,
          );
        }

        createdIds.push(createdId);
      }

      return createdIds;
    });
  }

  async bulkUpdateProfiles(
    updates: Array<{
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      passwordHash?: string;
    }>,
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      const collaboratorTable = this.tableName('collaborators');

      for (const update of updates) {
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (update.email !== undefined) {
          setClauses.push(`email = $${paramIndex++}`);
          values.push(update.email);
        }
        if (update.firstName !== undefined) {
          setClauses.push(`first_name = $${paramIndex++}`);
          values.push(update.firstName);
        }
        if (update.lastName !== undefined) {
          setClauses.push(`last_name = $${paramIndex++}`);
          values.push(update.lastName);
        }
        if (update.avatarUrl !== undefined) {
          setClauses.push(`avatar_url = $${paramIndex++}`);
          values.push(update.avatarUrl);
        }
        if (update.passwordHash !== undefined) {
          setClauses.push(`password_hash = $${paramIndex++}`);
          values.push(update.passwordHash);
        }

        if (setClauses.length > 0) {
          setClauses.push(`updated_at = NOW()`);
          values.push(update.id);
          await manager.query(
            `UPDATE ${collaboratorTable} SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
            values,
          );
        }
      }
    });
  }

  async bulkAssignRoles(
    updates: Array<{
      collaboratorId: string;
      roleIds: string[];
      assignedBy?: string;
    }>,
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      const collaboratorRoleTable = this.tableName('collaborator_roles');

      for (const update of updates) {
        await manager.query(
          `DELETE FROM ${collaboratorRoleTable} WHERE collaborator_id = $1`,
          [update.collaboratorId],
        );

        if (update.roleIds.length > 0) {
          const roleValues = update.roleIds
            .map(
              (roleId) =>
                `('${update.collaboratorId}', '${roleId}', '${update.assignedBy || ''}', NOW())`,
            )
            .join(',');
          await manager.query(
            `INSERT INTO ${collaboratorRoleTable} (collaborator_id, role_id, assigned_by, assigned_at) VALUES ${roleValues}`,
          );
        }
      }
    });
  }

  async assignRoles(
    collaboratorId: string,
    roleIds: string[],
    assignedBy?: string,
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      const collaboratorRoleTable = this.tableName('collaborator_roles');

      await manager.query(
        `DELETE FROM ${collaboratorRoleTable} WHERE collaborator_id = $1`,
        [collaboratorId],
      );

      if (roleIds.length > 0) {
        const roleValues = roleIds
          .map(
            (roleId) =>
              `('${collaboratorId}', '${roleId}', '${assignedBy || ''}', NOW())`,
          )
          .join(',');
        await manager.query(
          `INSERT INTO ${collaboratorRoleTable} (collaborator_id, role_id, assigned_by, assigned_at) VALUES ${roleValues}`,
        );
      }
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    const collaboratorTable = this.tableName('collaborators');
    await this.repository.query(
      `UPDATE ${collaboratorTable} SET last_login_at = NOW() WHERE id = $1`,
      [id],
    );
  }
}
