import { IRepository } from './repository.interface';
import { Collaborator } from '../entities/collaborator.entity';

export abstract class ICollaboratorRepository extends IRepository<Collaborator> {
  abstract findByEmail(email: string): Promise<Collaborator | null>;
  abstract findByEmails(emails: string[]): Promise<Collaborator[]>;
  abstract findByIdsWithRoles(ids: string[]): Promise<Collaborator[]>;
  abstract findByEmailWithRoles(email: string): Promise<Collaborator | null>;
  abstract findByIdWithRoles(id: string): Promise<Collaborator | null>;
  abstract findAllWithRoles(): Promise<Collaborator[]>;
  abstract bulkCreateWithRoles(params: {
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
  }): Promise<string[]>;
  abstract bulkUpdateProfiles(
    updates: Array<{
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      passwordHash?: string;
    }>,
  ): Promise<void>;
  abstract bulkAssignRoles(
    updates: Array<{
      collaboratorId: string;
      roleIds: string[];
      assignedBy?: string;
    }>,
  ): Promise<void>;
  abstract updateLastLogin(id: string): Promise<void>;
  abstract assignRoles(
    collaboratorId: string,
    roleIds: string[],
    assignedBy?: string,
  ): Promise<void>;
  abstract existsByEmail(email: string): Promise<boolean>;
  abstract permanentDelete(id: string): Promise<void>;
}
