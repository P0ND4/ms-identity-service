import {
  CollaboratorSummary,
  ICollaboratorsUseCase,
} from 'src/contexts/iam/domain/use-cases/collaborators/collaborators-use-case.interface';
import { CollaboratorStatus } from 'src/contexts/shared/domain/entities';
import { CollaboratorsController } from 'src/contexts/iam/infrastructure/http-api/v1/collaborators/controllers/collaborators.controller';

describe('CollaboratorsController', () => {
  let controller: CollaboratorsController;

  const collaboratorsUseCase = {
    getMe: jest.fn(),
    getCollaborators: jest.fn(),
    createCollaborator: jest.fn(),
    createCollaborators: jest.fn(),
    updateCollaborator: jest.fn(),
    updateCollaborators: jest.fn(),
    updateCollaboratorRoles: jest.fn(),
    updateCollaboratorsRoles: jest.fn(),
    updateCollaboratorStatus: jest.fn(),
    deleteCollaborator: jest.fn(),
  } as unknown as jest.Mocked<ICollaboratorsUseCase>;

  const collaborator: CollaboratorSummary = {
    id: 'c1',
    email: 'jane@company.com',
    firstName: 'Jane',
    lastName: 'Doe',
    status: CollaboratorStatus.ACTIVE,
    roles: ['admin'],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CollaboratorsController(collaboratorsUseCase);
  });

  it('getMe: returns collaborator profile', async () => {
    collaboratorsUseCase.getMe.mockResolvedValue(collaborator);

    const result = await controller.getMe('c1');

    expect(result).toEqual(collaborator);
    expect(collaboratorsUseCase.getMe).toHaveBeenCalledWith('c1');
  });

  it('getMe: propagates use-case errors', async () => {
    const error = new Error('collaborator not found');
    collaboratorsUseCase.getMe.mockRejectedValue(error);

    await expect(controller.getMe('missing')).rejects.toThrow(error);
  });

  it('getCollaborators: returns list', async () => {
    collaboratorsUseCase.getCollaborators.mockResolvedValue([collaborator]);

    const result = await controller.getCollaborators();

    expect(result).toEqual([collaborator]);
    expect(collaboratorsUseCase.getCollaborators).toHaveBeenCalledTimes(1);
  });

  it('createCollaborator: maps input and assignedBy header', async () => {
    collaboratorsUseCase.createCollaborator.mockResolvedValue(collaborator);

    const body = {
      email: 'jane@company.com',
      firstName: 'Jane',
      lastName: 'Doe',
      password: 'Secret123',
      status: CollaboratorStatus.ACTIVE,
      roleKeys: ['admin'],
    };
    const result = await controller.createCollaborator('actor-id', body);

    expect(result).toEqual(collaborator);
    expect(collaboratorsUseCase.createCollaborator).toHaveBeenCalledWith({
      ...body,
      assignedBy: 'actor-id',
    });
  });

  it('createCollaborator: propagates use-case errors', async () => {
    const error = new Error('email already exists');
    collaboratorsUseCase.createCollaborator.mockRejectedValue(error);

    await expect(
      controller.createCollaborator('actor-id', {
        email: 'jane@company.com',
        firstName: 'Jane',
        lastName: 'Doe',
        password: 'Secret123',
        status: CollaboratorStatus.ACTIVE,
        roleKeys: ['admin'],
      }),
    ).rejects.toThrow(error);
  });

  it('createCollaborators: delegates bulk creation', async () => {
    collaboratorsUseCase.createCollaborators.mockResolvedValue([collaborator]);

    const collaborators = [
      {
        email: 'jane@company.com',
        firstName: 'Jane',
        lastName: 'Doe',
        password: 'Secret123',
        status: CollaboratorStatus.ACTIVE,
        roleKeys: ['admin'],
      },
    ];
    const result = await controller.createCollaborators('actor-id', {
      collaborators,
    });

    expect(result).toEqual([collaborator]);
    expect(collaboratorsUseCase.createCollaborators).toHaveBeenCalledWith({
      collaborators,
      assignedBy: 'actor-id',
    });
  });

  it('updateCollaborator: delegates profile updates', async () => {
    collaboratorsUseCase.updateCollaborator.mockResolvedValue(collaborator);

    const result = await controller.updateCollaborator('c1', {
      email: 'jane.updated@company.com',
      firstName: 'Jane Updated',
      lastName: 'Doe Updated',
      avatarUrl: 'https://cdn.company.com/avatar.png',
      password: 'NewSecret123',
    });

    expect(result).toEqual(collaborator);
    expect(collaboratorsUseCase.updateCollaborator).toHaveBeenCalledWith('c1', {
      email: 'jane.updated@company.com',
      firstName: 'Jane Updated',
      lastName: 'Doe Updated',
      avatarUrl: 'https://cdn.company.com/avatar.png',
      password: 'NewSecret123',
    });
  });

  it('updateCollaborators: delegates bulk profile updates', async () => {
    collaboratorsUseCase.updateCollaborators.mockResolvedValue([collaborator]);

    const updates = [{ id: 'c1', firstName: 'Jane Updated' }];
    const result = await controller.updateCollaborators({ updates });

    expect(result).toEqual([collaborator]);
    expect(collaboratorsUseCase.updateCollaborators).toHaveBeenCalledWith(
      updates,
    );
  });

  it('updateCollaboratorRoles: delegates with assignedBy header', async () => {
    collaboratorsUseCase.updateCollaboratorRoles.mockResolvedValue(
      collaborator,
    );

    const result = await controller.updateCollaboratorRoles('c1', 'actor-id', {
      roleKeys: ['admin', 'operator'],
    });

    expect(result).toEqual(collaborator);
    expect(collaboratorsUseCase.updateCollaboratorRoles).toHaveBeenCalledWith(
      'c1',
      ['admin', 'operator'],
      'actor-id',
    );
  });

  it('updateCollaboratorsRoles: delegates bulk role replacement', async () => {
    collaboratorsUseCase.updateCollaboratorsRoles.mockResolvedValue([
      collaborator,
    ]);

    const updates = [{ id: 'c1', roleKeys: ['operator'] }];
    const result = await controller.updateCollaboratorsRoles('actor-id', {
      updates,
    });

    expect(result).toEqual([collaborator]);
    expect(collaboratorsUseCase.updateCollaboratorsRoles).toHaveBeenCalledWith(
      updates,
      'actor-id',
    );
  });

  it('updateCollaboratorStatus: delegates status update', async () => {
    collaboratorsUseCase.updateCollaboratorStatus.mockResolvedValue(
      collaborator,
    );

    const result = await controller.updateCollaboratorStatus('c1', {
      status: CollaboratorStatus.SUSPENDED,
    });

    expect(result).toEqual(collaborator);
    expect(collaboratorsUseCase.updateCollaboratorStatus).toHaveBeenCalledWith(
      'c1',
      CollaboratorStatus.SUSPENDED,
    );
  });

  it('updateCollaboratorStatus: propagates use-case errors', async () => {
    const error = new Error('invalid status transition');
    collaboratorsUseCase.updateCollaboratorStatus.mockRejectedValue(error);

    await expect(
      controller.updateCollaboratorStatus('c1', {
        status: CollaboratorStatus.SUSPENDED,
      }),
    ).rejects.toThrow(error);
  });

  it('deleteCollaborator: returns deleted true', async () => {
    collaboratorsUseCase.deleteCollaborator.mockResolvedValue(undefined);

    const result = await controller.deleteCollaborator('c1');

    expect(result).toEqual({ deleted: true });
    expect(collaboratorsUseCase.deleteCollaborator).toHaveBeenCalledWith('c1');
  });

  it('deleteCollaborator: propagates use-case errors', async () => {
    const error = new Error('collaborator not found');
    collaboratorsUseCase.deleteCollaborator.mockRejectedValue(error);

    await expect(controller.deleteCollaborator('missing')).rejects.toThrow(
      error,
    );
  });
});
