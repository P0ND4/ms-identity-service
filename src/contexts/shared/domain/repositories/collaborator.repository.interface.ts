import { IRepository } from './repository.interface';
import { Collaborator } from '../entities/collaborator.entity';

export abstract class ICollaboratorRepository extends IRepository<Collaborator> {
  abstract findByEmail(email: string): Promise<Collaborator | null>;
  abstract findByEmailWithRoles(email: string): Promise<Collaborator | null>;
  abstract findByIdWithRoles(id: string): Promise<Collaborator | null>;
  abstract findAllWithRoles(): Promise<Collaborator[]>;
  abstract updateLastLogin(id: string): Promise<void>;
  abstract assignRoles(
    collaboratorId: string,
    roleIds: string[],
    assignedBy?: string,
  ): Promise<void>;
  abstract existsByEmail(email: string): Promise<boolean>;
}
