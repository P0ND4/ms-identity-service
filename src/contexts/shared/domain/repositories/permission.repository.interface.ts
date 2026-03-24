import { IRepository } from './repository.interface';
import { Permission } from '../entities/permission.entity';

export interface IPermissionRepository extends IRepository<Permission> {
  findByKey(key: string): Promise<Permission | null>;
  findByKeys(keys: string[]): Promise<Permission[]>;
  syncPermissions(permissions: Partial<Permission>[]): Promise<{
    created: number;
    updated: number;
    removed: number;
  }>;
}
