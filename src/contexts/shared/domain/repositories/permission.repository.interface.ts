import { IRepository } from './repository.interface';
import { Permission } from '../entities/permission.entity';

export type PermissionSyncInput = {
  key: string;
  resource: string;
  action: string;
  description?: string;
  parentKey?: string;
};

export abstract class IPermissionRepository extends IRepository<Permission> {
  abstract findByKey(key: string): Promise<Permission | null>;
  abstract findByKeys(keys: string[]): Promise<Permission[]>;
  abstract findAllWithHierarchy(): Promise<Permission[]>;
  abstract syncPermissions(permissions: PermissionSyncInput[]): Promise<{
    created: number;
    updated: number;
    removed: number;
  }>;
}
