import { IRepository } from './repository.interface';
import { Collaborator } from '../entities/collaborator.entity';

export interface ICollaboratorRepository extends IRepository<Collaborator> {
  findByEmail(email: string): Promise<Collaborator | null>;
  findByEmailWithRoles(email: string): Promise<Collaborator | null>;
  updateLastLogin(id: string): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
}
