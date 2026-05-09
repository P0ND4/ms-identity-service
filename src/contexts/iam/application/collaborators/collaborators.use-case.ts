import { HttpStatus, Injectable } from '@nestjs/common';
import {
  CollaboratorBulkUpdateItem,
  CollaboratorRolesBulkUpdateItem,
  CollaboratorSummary,
  CollaboratorUpdateInput,
  ICollaboratorsUseCase,
} from 'src/contexts/iam/domain/use-cases/collaborators/collaborators-use-case.interface';
import {
  Collaborator,
  CollaboratorRole,
  CollaboratorStatus,
} from 'src/contexts/shared/domain/entities';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/identity.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';
import { IHashing } from 'src/contexts/shared/domain/interfaces/hashing.interface';
import { ICollaboratorRepository } from 'src/contexts/shared/domain/repositories/collaborator.repository.interface';
import { IRoleRepository } from 'src/contexts/shared/domain/repositories/role.repository.interface';
import {
  findDuplicateString,
  isUuid,
} from 'src/contexts/iam/application/helpers/validation.helper';

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

    if (!isUuid(collaboratorId)) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1061,
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
    password: string;
    status?: CollaboratorStatus;
    roleKeys?: string[];
    assignedBy?: string;
  }): Promise<CollaboratorSummary> {
    const exists = await this.collaboratorRepository.existsByEmail(
      params.email,
    );
    if (exists)
      throw new FoodaException(FoodaExceptionCodes.Ex1058, HttpStatus.CONFLICT);

    const passwordHash = await this.hashingService.hash(params.password);

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
      if (defaultRole) roleIds.push(defaultRole.id);
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
        FoodaExceptionCodes.Ex1057,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toCollaboratorSummary(collaborator);
  }

  async createCollaborators(params: {
    collaborators: Array<{
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      status?: CollaboratorStatus;
      roleKeys?: string[];
    }>;
    assignedBy?: string;
  }): Promise<CollaboratorSummary[]> {
    const payloadEmails = params.collaborators.map(
      (collaborator) => collaborator.email,
    );
    const duplicatedEmailInPayload = findDuplicateString(payloadEmails);
    if (duplicatedEmailInPayload) {
      throw new FoodaException(FoodaExceptionCodes.Ex1057, HttpStatus.CONFLICT);
    }

    const existingByEmail =
      await this.collaboratorRepository.findByEmails(payloadEmails);
    if (existingByEmail.length > 0) {
      throw new FoodaException(FoodaExceptionCodes.Ex1057, HttpStatus.CONFLICT);
    }

    const allRoleKeys = [
      ...new Set(
        params.collaborators.flatMap(
          (collaborator) => collaborator.roleKeys ?? [],
        ),
      ),
    ];
    const roles = await this.roleRepository.findByKeys(allRoleKeys);
    if (roles.length !== allRoleKeys.length) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1059,
        HttpStatus.BAD_REQUEST,
      );
    }
    const roleByKey = new Map(roles.map((role) => [role.key, role]));
    const defaultRole = await this.roleRepository.findDefaultRole();

    const preparedCollaborators: Array<{
      email: string;
      firstName: string;
      lastName: string;
      passwordHash: string;
      status: string;
      emailVerified: boolean;
      roleIds: string[];
      assignedBy?: string;
    }> = [];

    for (const collaborator of params.collaborators) {
      const passwordHash = await this.hashingService.hash(
        collaborator.password,
      );
      const roleKeys = collaborator.roleKeys ?? [];
      const roleIds = roleKeys.map((roleKey) => {
        const role = roleByKey.get(roleKey);
        if (!role) {
          throw new FoodaException(
            FoodaExceptionCodes.Ex1059,
            HttpStatus.BAD_REQUEST,
          );
        }
        return role.id;
      });

      if (roleIds.length === 0 && defaultRole) {
        roleIds.push(defaultRole.id);
      }

      preparedCollaborators.push({
        email: collaborator.email,
        firstName: collaborator.firstName,
        lastName: collaborator.lastName,
        passwordHash,
        status: collaborator.status ?? CollaboratorStatus.PENDING,
        emailVerified: false,
        roleIds,
        assignedBy: params.assignedBy,
      });
    }

    const createdIds = await this.collaboratorRepository.bulkCreateWithRoles({
      collaborators: preparedCollaborators,
    });

    const results: CollaboratorSummary[] = [];
    for (const collaboratorId of createdIds) {
      const collaborator =
        await this.collaboratorRepository.findByIdWithRoles(collaboratorId);
      if (!collaborator) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1056,
          HttpStatus.NOT_FOUND,
        );
      }
      results.push(this.toCollaboratorSummary(collaborator));
    }

    return results;
  }

  async updateCollaborator(
    collaboratorId: string,
    params: CollaboratorUpdateInput,
  ): Promise<CollaboratorSummary> {
    if (!isUuid(collaboratorId)) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1061,
        HttpStatus.BAD_REQUEST,
      );
    }

    const collaborator =
      await this.collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1056,
        HttpStatus.NOT_FOUND,
      );
    }

    if (params.email && params.email !== collaborator.email) {
      const existing = await this.collaboratorRepository.findByEmail(
        params.email,
      );
      if (existing && existing.id !== collaboratorId) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1057,
          HttpStatus.CONFLICT,
        );
      }
    }

    const updatePayload: Partial<Collaborator> = {};
    if (params.email !== undefined) updatePayload.email = params.email;
    if (params.firstName !== undefined)
      updatePayload.firstName = params.firstName;
    if (params.lastName !== undefined) updatePayload.lastName = params.lastName;
    if (params.avatarUrl !== undefined)
      updatePayload.avatarUrl = params.avatarUrl;
    if (params.password !== undefined) {
      updatePayload.passwordHash = await this.hashingService.hash(
        params.password,
      );
    }

    await this.collaboratorRepository.update(collaboratorId, updatePayload);

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

  async updateCollaborators(
    updates: CollaboratorBulkUpdateItem[],
  ): Promise<CollaboratorSummary[]> {
    const collaboratorIds = updates.map((update) => update.id);
    for (const collaboratorId of collaboratorIds) {
      if (!isUuid(collaboratorId)) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1061,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const collaborators = await this.collaboratorRepository.findAll();
    const collaboratorById = new Map(
      collaborators.map((collaborator) => [collaborator.id, collaborator]),
    );
    for (const collaboratorId of collaboratorIds) {
      if (!collaboratorById.has(collaboratorId)) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1056,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const emailUpdates = updates
      .filter((update) => update.email !== undefined)
      .map((update) => ({ id: update.id, email: update.email as string }));
    const duplicatedEmailInPayload = findDuplicateString(
      emailUpdates.map((item) => item.email),
    );
    if (duplicatedEmailInPayload) {
      throw new FoodaException(FoodaExceptionCodes.Ex1057, HttpStatus.CONFLICT);
    }

    const existingByEmail = await this.collaboratorRepository.findByEmails(
      emailUpdates.map((item) => item.email),
    );
    for (const existing of existingByEmail) {
      const owner = emailUpdates.find((item) => item.email === existing.email);
      if (owner && owner.id !== existing.id) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1057,
          HttpStatus.CONFLICT,
        );
      }
    }

    const preparedUpdates: Array<{
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      passwordHash?: string;
    }> = [];
    for (const update of updates) {
      preparedUpdates.push({
        id: update.id,
        email: update.email,
        firstName: update.firstName,
        lastName: update.lastName,
        avatarUrl: update.avatarUrl,
        passwordHash: update.password
          ? await this.hashingService.hash(update.password)
          : undefined,
      });
    }

    await this.collaboratorRepository.bulkUpdateProfiles(preparedUpdates);

    const results: CollaboratorSummary[] = [];
    for (const collaboratorId of collaboratorIds) {
      const collaborator =
        await this.collaboratorRepository.findByIdWithRoles(collaboratorId);
      if (!collaborator) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1056,
          HttpStatus.NOT_FOUND,
        );
      }
      results.push(this.toCollaboratorSummary(collaborator));
    }

    return results;
  }

  async updateCollaboratorRoles(
    collaboratorId: string,
    roleKeys: string[],
    assignedBy?: string,
  ): Promise<CollaboratorSummary> {
    if (!isUuid(collaboratorId)) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1061,
        HttpStatus.BAD_REQUEST,
      );
    }

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

  async updateCollaboratorsRoles(
    updates: CollaboratorRolesBulkUpdateItem[],
    assignedBy?: string,
  ): Promise<CollaboratorSummary[]> {
    const collaboratorIds = updates.map((update) => update.id);
    for (const collaboratorId of collaboratorIds) {
      if (!isUuid(collaboratorId)) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1061,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const existingCollaborators = await this.collaboratorRepository.findAll();
    const existingCollaboratorIds = new Set(
      existingCollaborators.map((collaborator) => collaborator.id),
    );
    for (const collaboratorId of collaboratorIds) {
      if (!existingCollaboratorIds.has(collaboratorId)) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1056,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const roleKeys = [...new Set(updates.flatMap((update) => update.roleKeys))];
    const roles = await this.roleRepository.findByKeys(roleKeys);
    if (roles.length !== roleKeys.length) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1059,
        HttpStatus.BAD_REQUEST,
      );
    }
    const roleByKey = new Map(roles.map((role) => [role.key, role]));

    await this.collaboratorRepository.bulkAssignRoles(
      updates.map((update) => ({
        collaboratorId: update.id,
        roleIds: update.roleKeys.map((roleKey) => {
          const role = roleByKey.get(roleKey);
          if (!role) {
            throw new FoodaException(
              FoodaExceptionCodes.Ex1059,
              HttpStatus.BAD_REQUEST,
            );
          }
          return role.id;
        }),
        assignedBy,
      })),
    );

    const results: CollaboratorSummary[] = [];
    for (const collaboratorId of collaboratorIds) {
      const collaborator =
        await this.collaboratorRepository.findByIdWithRoles(collaboratorId);
      if (!collaborator) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1056,
          HttpStatus.NOT_FOUND,
        );
      }
      results.push(this.toCollaboratorSummary(collaborator));
    }

    return results;
  }

  async updateCollaboratorStatus(
    collaboratorId: string,
    status: CollaboratorStatus,
  ): Promise<CollaboratorSummary> {
    if (!isUuid(collaboratorId)) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1061,
        HttpStatus.BAD_REQUEST,
      );
    }

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

  async deleteCollaborator(collaboratorId: string): Promise<void> {
    if (!isUuid(collaboratorId)) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1061,
        HttpStatus.BAD_REQUEST,
      );
    }

    const collaborator =
      await this.collaboratorRepository.findById(collaboratorId);
    if (!collaborator) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1056,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.collaboratorRepository.delete(collaboratorId);
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
