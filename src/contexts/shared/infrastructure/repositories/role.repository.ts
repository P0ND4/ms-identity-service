import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  constructor(
    @InjectRepository(Role)
    repository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    private readonly tenantContext: TenantContext,
  ) {
    super(repository);
  }

  private tableName(table: string): string {
    return `${this.tenantContext.schemaQuoted}.${table}`;
  }

  async findByKey(key: string): Promise<Role | null> {
    return (await this.repository
      .createQueryBuilder('r')
      .from(this.tableName('roles'), 'r')
      .where('r.key = :key', { key })
      .getOne()) as unknown as Role | null;
  }

  async findByKeys(keys: string[]): Promise<Role[]> {
    if (keys.length === 0) return [];
    return (await this.repository
      .createQueryBuilder('r')
      .from(this.tableName('roles'), 'r')
      .where('r.key IN (:...keys)', { keys })
      .getMany()) as unknown as Role[];
  }

  async findDefaultRole(): Promise<Role | null> {
    return (await this.repository
      .createQueryBuilder('r')
      .from(this.tableName('roles'), 'r')
      .where('r.is_default = true')
      .getOne()) as unknown as Role | null;
  }

  async findWithPermissions(id: string): Promise<Role | null> {
    return (await this.repository
      .createQueryBuilder('r')
      .from(this.tableName('roles'), 'r')
      .leftJoinAndSelect('r.rolePermissions', 'rp')
      .leftJoinAndSelect('rp.permission', 'p')
      .where('r.id = :id', { id })
      .getOne()) as unknown as Role | null;
  }

  async findAllWithPermissions(): Promise<Role[]> {
    return (await this.repository
      .createQueryBuilder('r')
      .from(this.tableName('roles'), 'r')
      .leftJoinAndSelect('r.rolePermissions', 'rp')
      .leftJoinAndSelect('rp.permission', 'p')
      .orderBy('r.created_at', 'ASC')
      .getMany()) as unknown as Role[];
  }

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

  async findById(id: string): Promise<Role | null> {
    return (await this.repository
      .createQueryBuilder('r')
      .from(this.tableName('roles'), 'r')
      .where('r.id = :id', { id })
      .getOne()) as unknown as Role | null;
  }

  async findAll(): Promise<Role[]> {
    return (await this.repository
      .createQueryBuilder('r')
      .from(this.tableName('roles'), 'r')
      .getMany()) as unknown as Role[];
  }

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

  async delete(id: string): Promise<void> {
    const rolesTable = this.tableName('roles');
    await this.repository.query(`DELETE FROM ${rolesTable} WHERE id = $1`, [
      id,
    ]);
  }

  async exists(id: string): Promise<boolean> {
    const rolesTable = this.tableName('roles');
    const result = await this.repository.query(
      `SELECT COUNT(*) as count FROM ${rolesTable} WHERE id = $1`,
      [id],
    );
    return parseInt(result[0].count, 10) > 0;
  }
}
