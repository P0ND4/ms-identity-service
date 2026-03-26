import { HttpStatus, Injectable } from '@nestjs/common';
import {
  CollaboratorSummary,
  ICollaboratorsUseCase,
} from 'src/contexts/iam/domain/use-cases/collaborators-use-case.interface';
import {
  Collaborator,
  CollaboratorStatus,
  CollaboratorRole,
} from 'src/contexts/shared/domain/entities';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/fooda.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';
import { IHashing } from 'src/contexts/shared/domain/interfaces/hashing.interface';
import { ICollaboratorRepository } from 'src/contexts/shared/domain/repositories/collaborator.repository.interface';
import { IRoleRepository } from 'src/contexts/shared/domain/repositories/role.repository.interface';

@Injectable()
export class CollaboratorsService implements ICollaboratorsUseCase {
  constructor(
    private readonly collaboratorRepository: ICollaboratorRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly hashingService: IHashing,
  ) {}

  async getMe(collaboratorId: string): Promise<CollaboratorSummary> {
    if (!collaboratorId) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1058,
        HttpStatus.BAD_REQUEST,
      );
    }

    const collaborator =
      await this.collaboratorRepository.findByIdWithRoles(collaboratorId);
    if (!collaborator) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1056,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toCollaboratorSummary(collaborator);
  }

  async getCollaborators(): Promise<CollaboratorSummary[]> {
    const collaborators = await this.collaboratorRepository.findAllWithRoles();
    return collaborators.map((collaborator) =>
      this.toCollaboratorSummary(collaborator),
    );
  }

  async createCollaborator(params: {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    status?: CollaboratorStatus;
    roleKeys?: string[];
    assignedBy?: string;
  }): Promise<CollaboratorSummary> {
    const exists = await this.collaboratorRepository.existsByEmail(
      params.email,
    );
    if (exists) {
      throw new FoodaException(FoodaExceptionCodes.Ex1057, HttpStatus.CONFLICT);
    }

    const passwordHash = params.password
      ? await this.hashingService.hash(params.password)
      : undefined;

    const createdCollaborator = await this.collaboratorRepository.save({
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      passwordHash,
      emailVerified: false,
      status: params.status ?? CollaboratorStatus.PENDING,
    });

    const roleIds = await this.resolveRoleIds(params.roleKeys ?? []);
    if (roleIds.length === 0) {
      const defaultRole = await this.roleRepository.findDefaultRole();
      if (defaultRole) {
        roleIds.push(defaultRole.id);
      }
    }
    if (roleIds.length > 0) {
      await this.collaboratorRepository.assignRoles(
        createdCollaborator.id,
        roleIds,
        params.assignedBy,
      );
    }

    const collaborator = await this.collaboratorRepository.findByIdWithRoles(
      createdCollaborator.id,
    );
    if (!collaborator) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1056,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toCollaboratorSummary(collaborator);
  }

  async updateCollaboratorRoles(
    collaboratorId: string,
    roleKeys: string[],
    assignedBy?: string,
  ): Promise<CollaboratorSummary> {
    const collaborator =
      await this.collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1056,
        HttpStatus.NOT_FOUND,
      );
    }

    const roleIds = await this.resolveRoleIds(roleKeys);
    await this.collaboratorRepository.assignRoles(
      collaboratorId,
      roleIds,
      assignedBy,
    );

    const updated =
      await this.collaboratorRepository.findByIdWithRoles(collaboratorId);
    if (!updated) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1056,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toCollaboratorSummary(updated);
  }

  async updateCollaboratorStatus(
    collaboratorId: string,
    status: CollaboratorStatus,
  ): Promise<CollaboratorSummary> {
    const collaborator =
      await this.collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1056,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.collaboratorRepository.update(collaboratorId, { status });

    const updated =
      await this.collaboratorRepository.findByIdWithRoles(collaboratorId);
    if (!updated) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1056,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toCollaboratorSummary(updated);
  }

  private async resolveRoleIds(roleKeys: string[]): Promise<string[]> {
    if (roleKeys.length === 0) return [];

    const roles = await this.roleRepository.findByKeys(roleKeys);
    if (roles.length !== roleKeys.length) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1059,
        HttpStatus.BAD_REQUEST,
      );
    }

    return roles.map((role) => role.id);
  }

  private toCollaboratorSummary(
    collaborator: Collaborator,
  ): CollaboratorSummary {
    return {
      id: collaborator.id,
      email: collaborator.email,
      firstName: collaborator.firstName,
      lastName: collaborator.lastName,
      status: collaborator.status,
      roles: (collaborator.collaboratorRoles ?? [])
        .map((collaboratorRole: CollaboratorRole) => collaboratorRole.role?.key)
        .filter((roleKey): roleKey is string => !!roleKey),
      createdAt: collaborator.createdAt,
    };
  }
}
