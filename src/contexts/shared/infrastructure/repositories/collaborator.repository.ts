import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import {
  Collaborator,
  CollaboratorRole,
  CollaboratorStatus,
} from '../../domain/entities';
import { ICollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';

@Injectable()
export class TypeOrmCollaboratorRepository
  extends TypeOrmRepository<Collaborator>
  implements ICollaboratorRepository
{
  constructor(
    @InjectRepository(Collaborator)
    repository: Repository<Collaborator>,
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

  async findByEmails(emails: string[]): Promise<Collaborator[]> {
    if (emails.length === 0) return [];
    return await this.repository.find({ where: { email: In(emails) } });
  }

  async findByIdsWithRoles(ids: string[]): Promise<Collaborator[]> {
    if (ids.length === 0) return [];
    return await this.repository.find({
      where: { id: In(ids) },
      relations: [
        'collaboratorRoles',
        'collaboratorRoles.role',
        'collaboratorRoles.role.rolePermissions',
        'collaboratorRoles.role.rolePermissions.permission',
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

  async bulkCreateWithRoles(params: {
    collaborators: Array<{
      email: string;
      firstName: string;
      lastName: string;
      passwordHash: string;
      status: string;
      emailVerified: boolean;
      roleIds: string[];
      assignedBy?: string;
    }>;
  }): Promise<string[]> {
    return await this.repository.manager.transaction(async (manager) => {
      const createdIds: string[] = [];

      for (const collaborator of params.collaborators) {
        const created = await manager.save(
          manager.create(Collaborator, {
            email: collaborator.email,
            firstName: collaborator.firstName,
            lastName: collaborator.lastName,
            passwordHash: collaborator.passwordHash,
            emailVerified: collaborator.emailVerified,
            status: collaborator.status as CollaboratorStatus,
          }),
        );

        if (collaborator.roleIds.length > 0) {
          await manager.insert(
            CollaboratorRole,
            collaborator.roleIds.map((roleId) => ({
              collaboratorId: created.id,
              roleId,
              assignedBy: collaborator.assignedBy,
            })),
          );
        }

        createdIds.push(created.id);
      }

      return createdIds;
    });
  }

  async bulkUpdateProfiles(
    updates: Array<{
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      passwordHash?: string;
    }>,
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      for (const update of updates) {
        const updatePayload: Partial<Collaborator> = {};
        if (update.email !== undefined) updatePayload.email = update.email;
        if (update.firstName !== undefined)
          updatePayload.firstName = update.firstName;
        if (update.lastName !== undefined)
          updatePayload.lastName = update.lastName;
        if (update.avatarUrl !== undefined)
          updatePayload.avatarUrl = update.avatarUrl;
        if (update.passwordHash !== undefined)
          updatePayload.passwordHash = update.passwordHash;

        if (Object.keys(updatePayload).length > 0) {
          await manager.update(Collaborator, { id: update.id }, updatePayload);
        }
      }
    });
  }

  async bulkAssignRoles(
    updates: Array<{
      collaboratorId: string;
      roleIds: string[];
      assignedBy?: string;
    }>,
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      for (const update of updates) {
        await manager.delete(CollaboratorRole, {
          collaboratorId: update.collaboratorId,
        });

        if (update.roleIds.length > 0) {
          await manager.insert(
            CollaboratorRole,
            update.roleIds.map((roleId) => ({
              collaboratorId: update.collaboratorId,
              roleId,
              assignedBy: update.assignedBy,
            })),
          );
        }
      }
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
