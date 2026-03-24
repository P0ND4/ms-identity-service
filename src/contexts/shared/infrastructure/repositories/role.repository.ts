// infrastructure/persistence/typeorm/repositories/role.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { Role } from '../../domain/entities/role.entity';
import { RolePermission } from '../../domain/entities/role-permission.entity';

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

  async findDefaultRole(): Promise<Role | null> {
    return await this.repository.findOne({ where: { isDefault: true } });
  }

  async findWithPermissions(id: string): Promise<Role | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
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
}
