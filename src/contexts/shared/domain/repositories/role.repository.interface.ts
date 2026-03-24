import { IRepository } from './repository.interface';
import { Role } from '../entities/role.entity';

export interface IRoleRepository extends IRepository<Role> {
  findByKey(key: string): Promise<Role | null>;
  findDefaultRole(): Promise<Role | null>;
  findWithPermissions(id: string): Promise<Role | null>;
}
