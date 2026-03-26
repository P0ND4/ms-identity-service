import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import { Collaborator } from '../../domain/entities/collaborator.entity';
import { ICollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import { CollaboratorRole } from '../../domain/entities/collaborator-role.entity';

@Injectable()
export class TypeOrmCollaboratorRepository
  extends TypeOrmRepository<Collaborator>
  implements ICollaboratorRepository
{
  constructor(
    @InjectRepository(Collaborator)
    repository: Repository<Collaborator>,
    @InjectRepository(CollaboratorRole)
    private readonly collaboratorRoleRepository: Repository<CollaboratorRole>,
  ) {
    super(repository);
  }

  async findByEmail(email: string): Promise<Collaborator | null> {
    return await this.repository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'passwordHash',
        'firstName',
        'lastName',
        'status',
        'createdAt',
      ],
    });
  }

  async findByEmailWithRoles(email: string): Promise<Collaborator | null> {
    return await this.repository.findOne({
      where: { email },
      relations: [
        'collaboratorRoles',
        'collaboratorRoles.role',
        'collaboratorRoles.role.rolePermissions',
        'collaboratorRoles.role.rolePermissions.permission',
      ],
    });
  }

  async findByIdWithRoles(id: string): Promise<Collaborator | null> {
    return await this.repository.findOne({
      where: { id },
      relations: [
        'collaboratorRoles',
        'collaboratorRoles.role',
        'collaboratorRoles.role.rolePermissions',
        'collaboratorRoles.role.rolePermissions.permission',
      ],
    });
  }

  async findAllWithRoles(): Promise<Collaborator[]> {
    return await this.repository.find({
      relations: [
        'collaboratorRoles',
        'collaboratorRoles.role',
        'collaboratorRoles.role.rolePermissions',
        'collaboratorRoles.role.rolePermissions.permission',
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.repository.update(id, { lastLoginAt: new Date() });
  }

  async assignRoles(
    collaboratorId: string,
    roleIds: string[],
    assignedBy?: string,
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      await manager.delete(CollaboratorRole, { collaboratorId });

      if (roleIds.length > 0) {
        await manager.insert(
          CollaboratorRole,
          roleIds.map((roleId) => ({
            collaboratorId,
            roleId,
            assignedBy,
          })),
        );
      }
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({ where: { email } });
    return count > 0;
  }
}
