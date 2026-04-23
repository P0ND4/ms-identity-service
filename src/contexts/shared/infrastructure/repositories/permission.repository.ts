import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import {
  IPermissionRepository,
  PermissionSyncInput,
} from '../../domain/repositories/permission.repository.interface';
import { Permission } from '../../domain/entities/permission.entity';
import { TenantContext } from '../tenant/tenant-context.service';

@Injectable()
export class TypeOrmPermissionRepository
  extends TypeOrmRepository<Permission>
  implements IPermissionRepository
{
  constructor(
    @InjectRepository(Permission)
    repository: Repository<Permission>,
    private readonly tenantContext: TenantContext,
  ) {
    super(repository);
  }

  private tableName(table: string): string {
    return `${this.tenantContext.schemaQuoted}.${table}`;
  }

  async findByKey(key: string): Promise<Permission | null> {
    return (await this.repository
      .createQueryBuilder('p')
      .from(this.tableName('permissions'), 'p')
      .where('p.key = :key', { key })
      .getOne()) as unknown as Permission | null;
  }

  async findByKeys(keys: string[]): Promise<Permission[]> {
    if (keys.length === 0) return [];
    return (await this.repository
      .createQueryBuilder('p')
      .from(this.tableName('permissions'), 'p')
      .where('p.key IN (:...keys)', { keys })
      .getMany()) as unknown as Permission[];
  }

  async findAllWithHierarchy(): Promise<Permission[]> {
    return (await this.repository
      .createQueryBuilder('p')
      .from(this.tableName('permissions'), 'p')
      .leftJoinAndSelect('p.parent', 'parent')
      .leftJoinAndSelect('p.children', 'children')
      .orderBy('p.key', 'ASC')
      .getMany()) as unknown as Permission[];
  }

  async syncPermissions(
    permissions: PermissionSyncInput[],
  ): Promise<{ created: number; updated: number; removed: number }> {
    let created = 0,
      updated = 0,
      removed = 0;
    const permissionsTable = this.tableName('permissions');

    await this.repository.manager.transaction(async (manager) => {
      const existingResult = await manager.query(
        `SELECT id, key, resource, action, description, parent_id as "parentId" FROM ${permissionsTable}`,
      );
      const existingMap = new Map<any, any>(
        existingResult.map((p: any) => [p.key, p]),
      );

      const incomingKeys = new Set(
        permissions.map((permission) => permission.key),
      );

      for (const permission of permissions) {
        const existingPermission = existingMap.get(permission.key);

        if (!existingPermission) {
          await manager.query(
            `INSERT INTO ${permissionsTable} 
             (id, key, resource, action, description, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())`,
            [
              permission.key,
              permission.resource,
              permission.action,
              permission.description,
            ],
          );
          created++;
          continue;
        }

        const shouldUpdateBaseFields =
          existingPermission.resource !== permission.resource ||
          existingPermission.action !== permission.action ||
          existingPermission.description !== permission.description;

        if (shouldUpdateBaseFields) {
          await manager.query(
            `UPDATE ${permissionsTable} 
             SET resource = $1, action = $2, description = $3, updated_at = NOW()
             WHERE id = $4`,
            [
              permission.resource,
              permission.action,
              permission.description,
              existingPermission.id,
            ],
          );
          updated++;
        }
      }

      const allIncomingResult = await manager.query(
        `SELECT id, key, parent_id as "parentId" FROM ${permissionsTable} WHERE key = ANY($1)`,
        [Array.from(incomingKeys)],
      );
      const incomingMap = new Map<any, any>(
        allIncomingResult.map((p: any) => [p.key, p]),
      );

      for (const permission of permissions) {
        const current = incomingMap.get(permission.key);
        if (!current) continue;

        const parentId = permission.parentKey
          ? incomingMap.get(permission.parentKey)?.id
          : null;

        if (current.parentId !== parentId) {
          const newParentId = parentId ?? null;
          await manager.query(
            `UPDATE ${permissionsTable} SET parent_id = $1, updated_at = NOW() WHERE id = $2`,
            [newParentId, current.id],
          );
          updated++;
        }
      }

      const toRemove = existingResult.filter(
        (p: any) => !incomingKeys.has(p.key),
      );

      if (toRemove.length > 0) {
        const removeIds = toRemove.map((p: any) => p.id);
        await manager.query(
          `UPDATE ${permissionsTable} SET deleted_at = NOW() WHERE id = ANY($1)`,
          [removeIds],
        );
        removed = toRemove.length;
      }
    });

    return { created, updated, removed };
  }

  async findById(id: string): Promise<Permission | null> {
    return (await this.repository
      .createQueryBuilder('p')
      .from(this.tableName('permissions'), 'p')
      .where('p.id = :id', { id })
      .getOne()) as unknown as Permission | null;
  }

  async findAll(): Promise<Permission[]> {
    return (await this.repository
      .createQueryBuilder('p')
      .from(this.tableName('permissions'), 'p')
      .getMany()) as unknown as Permission[];
  }

  async save(entity: Partial<Permission>): Promise<Permission> {
    const permissionsTable = this.tableName('permissions');
    const result = await this.repository.query(
      `INSERT INTO ${permissionsTable} 
       (id, key, resource, action, description, parent_id, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [
        entity.key,
        entity.resource,
        entity.action,
        entity.description,
        entity.parentId ?? null,
      ],
    );
    return result[0] as unknown as Permission;
  }

  async update(id: string, entity: Partial<Permission>): Promise<Permission> {
    const permissionsTable = this.tableName('permissions');
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (entity.key !== undefined) {
      setClauses.push(`key = $${paramIndex++}`);
      values.push(entity.key);
    }
    if (entity.resource !== undefined) {
      setClauses.push(`resource = $${paramIndex++}`);
      values.push(entity.resource);
    }
    if (entity.action !== undefined) {
      setClauses.push(`action = $${paramIndex++}`);
      values.push(entity.action);
    }
    if (entity.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(entity.description);
    }
    if (entity.parentId !== undefined) {
      setClauses.push(`parent_id = $${paramIndex++}`);
      values.push(entity.parentId);
    }

    if (setClauses.length > 0) {
      setClauses.push(`updated_at = NOW()`);
      values.push(id);
      await this.repository.query(
        `UPDATE ${permissionsTable} SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
        values,
      );
    }

    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    const permissionsTable = this.tableName('permissions');
    await this.repository.query(
      `UPDATE ${permissionsTable} SET deleted_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  async exists(id: string): Promise<boolean> {
    const permissionsTable = this.tableName('permissions');
    const result = await this.repository.query(
      `SELECT COUNT(*) as count FROM ${permissionsTable} WHERE id = $1`,
      [id],
    );
    return parseInt(result[0].count, 10) > 0;
  }
}
