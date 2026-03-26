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

export abstract class ICollaboratorsUseCase {
  abstract getMe(collaboratorId: string): Promise<CollaboratorSummary>;
  abstract getCollaborators(): Promise<CollaboratorSummary[]>;
  abstract createCollaborator(params: {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    status?: CollaboratorStatus;
    roleKeys?: string[];
    assignedBy?: string;
  }): Promise<CollaboratorSummary>;
  abstract updateCollaboratorRoles(
    collaboratorId: string,
    roleKeys: string[],
    assignedBy?: string,
  ): Promise<CollaboratorSummary>;
  abstract updateCollaboratorStatus(
    collaboratorId: string,
    status: CollaboratorStatus,
  ): Promise<CollaboratorSummary>;
}
