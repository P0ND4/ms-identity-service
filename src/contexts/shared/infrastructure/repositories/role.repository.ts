// infrastructure/persistence/typeorm/repositories/role.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { Role } from '../../domain/entities/role.entity';
import { RolePermission } from '../../domain/entities/role-permission.entity';
import { CollaboratorRole } from '../../domain/entities/collaborator-role.entity';

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
  ) {
    super(repository);
  }

  async findByKey(key: string): Promise<Role | null> {
    return await this.repository.findOne({ where: { key } });
  }

  async findByKeys(keys: string[]): Promise<Role[]> {
    if (keys.length === 0) return [];
    return await this.repository.find({ where: { key: In(keys) } });
  }

  async findDefaultRole(): Promise<Role | null> {
    return await this.repository.findOne({ where: { isDefault: true } });
  }

  async findWithPermissions(id: string): Promise<Role | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
  }

  async findAllWithPermissions(): Promise<Role[]> {
    return await this.repository.find({
      relations: ['rolePermissions', 'rolePermissions.permission'],
      order: { createdAt: 'ASC' },
    });
  }

  // Método adicional útil para el controller PUT /roles/:id/permissions
  async updateRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    await this.rolePermissionRepo.manager.transaction(async (manager) => {
      await manager.delete(RolePermission, { roleId });

      if (permissionIds.length > 0) {
        const entities = permissionIds.map((pid) => ({
          roleId,
          permissionId: pid,
        }));
        await manager.insert(RolePermission, entities);
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
    await this.repository.manager.transaction(async (manager) => {
      for (const update of updates) {
        const updatePayload: Partial<Role> = {};
        if (update.key !== undefined) updatePayload.key = update.key;
        if (update.name !== undefined) updatePayload.name = update.name;
        if (update.description !== undefined)
          updatePayload.description = update.description;
        if (update.isDefault !== undefined)
          updatePayload.isDefault = update.isDefault;

        if (Object.keys(updatePayload).length > 0) {
          await manager.update(Role, { id: update.id }, updatePayload);
        }
      }
    });
  }

  async bulkUpdateRolePermissions(
    updates: Array<{ roleId: string; permissionIds: string[] }>,
  ): Promise<void> {
    await this.rolePermissionRepo.manager.transaction(async (manager) => {
      for (const update of updates) {
        await manager.delete(RolePermission, { roleId: update.roleId });

        if (update.permissionIds.length > 0) {
          await manager.insert(
            RolePermission,
            update.permissionIds.map((permissionId) => ({
              roleId: update.roleId,
              permissionId,
            })),
          );
        }
      }
    });
  }

  async deleteRoleWithRelations(roleId: string): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      await manager.delete(CollaboratorRole, { roleId });
      await manager.delete(RolePermission, { roleId });
      await manager.delete(Role, { id: roleId });
    });
  }
}
