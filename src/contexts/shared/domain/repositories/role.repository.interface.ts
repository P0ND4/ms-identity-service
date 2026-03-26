import { IRepository } from './repository.interface';
import { Role } from '../entities/role.entity';

export abstract class IRoleRepository extends IRepository<Role> {
  abstract findByKey(key: string): Promise<Role | null>;
  abstract findByKeys(keys: string[]): Promise<Role[]>;
  abstract findDefaultRole(): Promise<Role | null>;
  abstract findWithPermissions(id: string): Promise<Role | null>;
  abstract findAllWithPermissions(): Promise<Role[]>;
  abstract updateRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void>;
  abstract bulkUpdateRoles(
    updates: Array<{
      id: string;
      key?: string;
      name?: string;
      description?: string;
      isDefault?: boolean;
    }>,
  ): Promise<void>;
  abstract bulkUpdateRolePermissions(
    updates: Array<{ roleId: string; permissionIds: string[] }>,
  ): Promise<void>;
  abstract deleteRoleWithRelations(roleId: string): Promise<void>;
}
