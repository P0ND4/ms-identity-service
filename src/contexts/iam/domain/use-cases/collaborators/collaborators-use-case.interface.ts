import { CollaboratorStatus } from 'src/contexts/shared/domain/entities';

export type CollaboratorSummary = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: CollaboratorStatus;
  roles: string[];
  createdAt: Date;
};

export type CollaboratorUpdateInput = {
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  password?: string;
};

export type CollaboratorBulkUpdateItem = CollaboratorUpdateInput & {
  id: string;
};

export type CollaboratorRolesBulkUpdateItem = {
  id: string;
  roleKeys: string[];
};

export abstract class ICollaboratorsUseCase {
  abstract getMe(collaboratorId: string): Promise<CollaboratorSummary>;
  abstract getCollaborators(): Promise<CollaboratorSummary[]>;
  abstract createCollaborator(params: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    status?: CollaboratorStatus;
    roleKeys?: string[];
    assignedBy?: string;
  }): Promise<CollaboratorSummary>;
  abstract createCollaborators(params: {
    collaborators: Array<{
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      status?: CollaboratorStatus;
      roleKeys?: string[];
    }>;
    assignedBy?: string;
  }): Promise<CollaboratorSummary[]>;
  abstract updateCollaborator(
    collaboratorId: string,
    params: CollaboratorUpdateInput,
  ): Promise<CollaboratorSummary>;
  abstract updateCollaborators(
    updates: CollaboratorBulkUpdateItem[],
  ): Promise<CollaboratorSummary[]>;
  abstract updateCollaboratorRoles(
    collaboratorId: string,
    roleKeys: string[],
    assignedBy?: string,
  ): Promise<CollaboratorSummary>;
  abstract updateCollaboratorsRoles(
    updates: CollaboratorRolesBulkUpdateItem[],
    assignedBy?: string,
  ): Promise<CollaboratorSummary[]>;
  abstract updateCollaboratorStatus(
    collaboratorId: string,
    status: CollaboratorStatus,
  ): Promise<CollaboratorSummary>;
  abstract deleteCollaborator(collaboratorId: string): Promise<void>;
  abstract permanentDeleteCollaborator(collaboratorId: string): Promise<void>;
}
