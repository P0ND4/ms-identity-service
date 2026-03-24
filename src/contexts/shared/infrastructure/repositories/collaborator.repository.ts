import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import { Collaborator } from '../../domain/entities/collaborator.entity';
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

  async updateLastLogin(id: string): Promise<void> {
    await this.repository.update(id, { lastLoginAt: new Date() });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({ where: { email } });
    return count > 0;
  }
}
