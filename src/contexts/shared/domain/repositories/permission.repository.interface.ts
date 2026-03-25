import { IRepository } from './repository.interface';
import { Permission } from '../entities/permission.entity';

export abstract class IPermissionRepository extends IRepository<Permission> {
  abstract findByKey(key: string): Promise<Permission | null>;
  abstract findByKeys(keys: string[]): Promise<Permission[]>;
  abstract syncPermissions(permissions: Partial<Permission>[]): Promise<{
    created: number;
    updated: number;
    removed: number;
  }>;
}
