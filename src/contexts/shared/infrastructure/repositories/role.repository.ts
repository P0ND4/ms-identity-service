import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { Role } from '../../domain/entities/role.entity';
import { RolePermission } from '../../domain/entities/role-permission.entity';
import { TenantContext } from '../tenant/tenant-context.service';

@Injectable()
export class TypeOrmRoleRepository
  extends TypeOrmRepository<Role>
  implements IRoleRepository
{
  private static readonly ROLE_PERMISSIONS_RELATIONS = {
    rolePermissions: { permission: true },
  };

  constructor(
    @InjectRepository(Role)
    repository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    tenantContext: TenantContext,
    dataSource: DataSource,
  ) {
    super(repository, tenantContext, dataSource);
  }

  /* ------------------------------------------------------------------ */
  /*  Read helpers                                                      */
  /* ------------------------------------------------------------------ */

  async findByKey(key: string): Promise<Role | null> {
    return this.withTenantQueryRunner((manager) =>
      manager.findOne(Role, { where: { key } }),
    );
  }

  async findByKeys(keys: string[]): Promise<Role[]> {
    if (keys.length === 0) return [];
    return this.withTenantQueryRunner((manager) =>
      manager.find(Role, { where: { key: In(keys) } }),
    );
  }

  async findDefaultRole(): Promise<Role | null> {
    return this.withTenantQueryRunner((manager) =>
      manager.findOne(Role, { where: { isDefault: true } }),
    );
  }

  async findWithPermissions(id: string): Promise<Role | null> {
    return this.withTenantQueryRunner((manager) =>
      manager.findOne(Role, {
        where: { id },
        relations: TypeOrmRoleRepository.ROLE_PERMISSIONS_RELATIONS,
      }),
    );
  }

  async findAllWithPermissions(): Promise<Role[]> {
    return this.withTenantQueryRunner((manager) =>
      manager.find(Role, {
        relations: TypeOrmRoleRepository.ROLE_PERMISSIONS_RELATIONS,
        order: { createdAt: 'ASC' },
      }),
    );
  }

  /* ------------------------------------------------------------------ */
  /*  CUD operations                                                    */
  /* ------------------------------------------------------------------ */

  async save(entity: Partial<Role>): Promise<Role> {
    const rolesTable = this.tableName('roles');
    const result = await this.repository.query(
      `INSERT INTO ${rolesTable} 
       (id, key, name, description, is_default, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [entity.key, entity.name, entity.description, entity.isDefault ?? false],
    );
    return result[0] as unknown as Role;
  }

  async update(id: string, entity: Partial<Role>): Promise<Role> {
    const rolesTable = this.tableName('roles');
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (entity.key !== undefined) {
      setClauses.push(`key = $${paramIndex++}`);
      values.push(entity.key);
    }
    if (entity.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(entity.name);
    }
    if (entity.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(entity.description);
    }
    if (entity.isDefault !== undefined) {
      setClauses.push(`is_default = $${paramIndex++}`);
      values.push(entity.isDefault);
    }

    if (setClauses.length > 0) {
      setClauses.push(`updated_at = NOW()`);
      values.push(id);
      await this.repository.query(
        `UPDATE ${rolesTable} SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
        values,
      );
    }

    return (await this.findById(id))!;
  }

  /* ------------------------------------------------------------------ */
  /*  Permission management                                             */
  /* ------------------------------------------------------------------ */

  async updateRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    const rolePermissionTable = this.tableName('role_permissions');

    await this.rolePermissionRepo.manager.transaction(async (manager) => {
      await manager.query(
        `DELETE FROM ${rolePermissionTable} WHERE role_id = $1`,
        [roleId],
      );

      if (permissionIds.length > 0) {
        const permValues = permissionIds
          .map((pid) => `('${roleId}', '${pid}')`)
          .join(',');
        await manager.query(
          `INSERT INTO ${rolePermissionTable} (role_id, permission_id) VALUES ${permValues}`,
        );
      }
    });
  }

  async bulkUpdateRoles(
    updates: Array<{
      id: string;
      key?: string;
      name?: string;
      description?: string;
      isDefault?: boolean;
    }>,
  ): Promise<void> {
    const rolesTable = this.tableName('roles');

    await this.repository.manager.transaction(async (manager) => {
      for (const update of updates) {
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (update.key !== undefined) {
          setClauses.push(`key = $${paramIndex++}`);
          values.push(update.key);
        }
        if (update.name !== undefined) {
          setClauses.push(`name = $${paramIndex++}`);
          values.push(update.name);
        }
        if (update.description !== undefined) {
          setClauses.push(`description = $${paramIndex++}`);
          values.push(update.description);
        }
        if (update.isDefault !== undefined) {
          setClauses.push(`is_default = $${paramIndex++}`);
          values.push(update.isDefault);
        }

        if (setClauses.length > 0) {
          setClauses.push(`updated_at = NOW()`);
          values.push(update.id);
          await manager.query(
            `UPDATE ${rolesTable} SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
            values,
          );
        }
      }
    });
  }

  async bulkUpdateRolePermissions(
    updates: Array<{ roleId: string; permissionIds: string[] }>,
  ): Promise<void> {
    const rolePermissionTable = this.tableName('role_permissions');

    await this.rolePermissionRepo.manager.transaction(async (manager) => {
      for (const update of updates) {
        await manager.query(
          `DELETE FROM ${rolePermissionTable} WHERE role_id = $1`,
          [update.roleId],
        );

        if (update.permissionIds.length > 0) {
          const permValues = update.permissionIds
            .map((pid) => `('${update.roleId}', '${pid}')`)
            .join(',');
          await manager.query(
            `INSERT INTO ${rolePermissionTable} (role_id, permission_id) VALUES ${permValues}`,
          );
        }
      }
    });
  }

  async deleteRoleWithRelations(roleId: string): Promise<void> {
    const rolesTable = this.tableName('roles');
    const collaboratorRolesTable = this.tableName('collaborator_roles');
    const rolePermissionsTable = this.tableName('role_permissions');

    await this.repository.manager.transaction(async (manager) => {
      await manager.query(
        `DELETE FROM ${collaboratorRolesTable} WHERE role_id = $1`,
        [roleId],
      );
      await manager.query(
        `DELETE FROM ${rolePermissionsTable} WHERE role_id = $1`,
        [roleId],
      );
      await manager.query(`DELETE FROM ${rolesTable} WHERE id = $1`, [roleId]);
    });
  }
}
