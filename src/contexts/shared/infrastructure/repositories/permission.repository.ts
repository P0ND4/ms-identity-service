import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import {
  IPermissionRepository,
  PermissionSyncInput,
} from '../../domain/repositories/permission.repository.interface';
import { Permission } from '../../domain/entities/permission.entity';

@Injectable()
export class TypeOrmPermissionRepository
  extends TypeOrmRepository<Permission>
  implements IPermissionRepository
{
  constructor(
    @InjectRepository(Permission)
    repository: Repository<Permission>,
  ) {
    super(repository);
  }

  async findByKey(key: string): Promise<Permission | null> {
    return await this.repository.findOne({ where: { key } });
  }

  async findByKeys(keys: string[]): Promise<Permission[]> {
    if (keys.length === 0) return [];
    return await this.repository.find({ where: { key: In(keys) } });
  }

  async findAllWithHierarchy(): Promise<Permission[]> {
    return await this.repository.find({
      relations: ['parent', 'children'],
      order: { key: 'ASC' },
    });
  }

  async syncPermissions(
    permissions: PermissionSyncInput[],
  ): Promise<{ created: number; updated: number; removed: number }> {
    let created = 0,
      updated = 0,
      removed = 0;

    await this.repository.manager.transaction(async (manager) => {
      const existing = await manager.find(Permission);
      const existingMap = new Map(
        existing.map((permission) => [permission.key, permission]),
      );
      const incomingKeys = new Set(
        permissions.map((permission) => permission.key),
      );

      for (const permission of permissions) {
        const existingPermission = existingMap.get(permission.key);

        if (!existingPermission) {
          await manager.save(Permission, {
            key: permission.key,
            resource: permission.resource,
            action: permission.action,
            description: permission.description,
          });
          created++;
          continue;
        }

        const shouldUpdateBaseFields =
          existingPermission.resource !== permission.resource ||
          existingPermission.action !== permission.action ||
          existingPermission.description !== permission.description;

        if (shouldUpdateBaseFields) {
          await manager.update(Permission, existingPermission.id, {
            resource: permission.resource,
            action: permission.action,
            description: permission.description,
          });
          updated++;
        }
      }

      const allIncoming = await manager.find(Permission, {
        where: { key: In(Array.from(incomingKeys)) },
      });
      const incomingMap = new Map(
        allIncoming.map((permission) => [permission.key, permission]),
      );

      for (const permission of permissions) {
        const current = incomingMap.get(permission.key);
        if (!current) continue;

        const parentId = permission.parentKey
          ? incomingMap.get(permission.parentKey)?.id
          : null;

        if (current.parentId !== (parentId ?? null)) {
          await manager.update(Permission, current.id, {
            parentId: parentId ?? undefined,
          });
          updated++;
        }
      }

      const toRemove = existing.filter(
        (permission) => !incomingKeys.has(permission.key),
      );
      if (toRemove.length > 0) {
        await manager.softDelete(Permission, {
          key: In(toRemove.map((permission) => permission.key)),
        });
        removed = toRemove.length;
      }
    });

    return { created, updated, removed };
  }
}
