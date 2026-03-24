import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import { IPermissionRepository } from '../../domain/repositories/permission.repository.interface';
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

  async syncPermissions(
    permissions: Partial<Permission>[],
  ): Promise<{ created: number; updated: number; removed: number }> {
    let created = 0,
      updated = 0,
      removed = 0;

    // Obtener existentes
    const existing = await this.repository.find();
    const existingMap = new Map(existing.map((p) => [p.key, p]));
    const incomingKeys = new Set(permissions.map((p) => p.key));

    // Crear o actualizar
    for (const perm of permissions) {
      const existingPerm = existingMap.get(perm.key!);

      if (!existingPerm) {
        await this.repository.save(perm);
        created++;
      } else if (
        existingPerm.resource !== perm.resource ||
        existingPerm.action !== perm.action
      ) {
        await this.repository.update(existingPerm.id, perm);
        updated++;
      }
    }

    // Soft delete los que ya no existen en código
    const toRemove = existing.filter((p) => !incomingKeys.has(p.key));
    if (toRemove.length > 0) {
      await this.repository.softDelete({ key: In(toRemove.map((p) => p.key)) });
      removed = toRemove.length;
    }

    return { created, updated, removed };
  }
}
