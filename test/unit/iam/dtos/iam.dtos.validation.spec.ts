import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateRolePermissionsDto } from 'src/contexts/iam/infrastructure/http-api/v1/access/dtos/update-role-permissions.dto';
import { UpdateRolesDto } from 'src/contexts/iam/infrastructure/http-api/v1/access/dtos/update-roles.dto';
import { UpdateRolesPermissionsDto } from 'src/contexts/iam/infrastructure/http-api/v1/access/dtos/update-roles-permissions.dto';
import { CreateCollaboratorDto } from 'src/contexts/iam/infrastructure/http-api/v1/collaborators/dtos/create-collaborator.dto';
import { CreateCollaboratorsDto } from 'src/contexts/iam/infrastructure/http-api/v1/collaborators/dtos/create-collaborators.dto';
import { UpdateCollaboratorStatusDto } from 'src/contexts/iam/infrastructure/http-api/v1/collaborators/dtos/update-collaborator-status.dto';
import { UpdateCollaboratorsDto } from 'src/contexts/iam/infrastructure/http-api/v1/collaborators/dtos/update-collaborators.dto';
import { UpdateCollaboratorsRolesDto } from 'src/contexts/iam/infrastructure/http-api/v1/collaborators/dtos/update-collaborators-roles.dto';
import { CollaboratorStatus } from 'src/contexts/shared/domain/entities';

async function validateDto<T extends object>(
  type: new () => T,
  payload: unknown,
) {
  const instance = plainToInstance(type, payload);
  return validate(instance);
}

describe('IAM DTO validations', () => {
  it('UpdateRolePermissionsDto: accepts valid permissionKeys', async () => {
    const errors = await validateDto(UpdateRolePermissionsDto, {
      permissionKeys: ['users:read', 'roles:update'],
    });

    expect(errors).toHaveLength(0);
  });

  it('UpdateRolePermissionsDto: rejects duplicate permissionKeys', async () => {
    const errors = await validateDto(UpdateRolePermissionsDto, {
      permissionKeys: ['users:read', 'users:read'],
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('UpdateRolesDto: accepts valid bulk update with uuid', async () => {
    const errors = await validateDto(UpdateRolesDto, {
      updates: [
        {
          id: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
          name: 'Admin Updated',
        },
      ],
    });

    expect(errors).toHaveLength(0);
  });

  it('UpdateRolesDto: rejects invalid uuid', async () => {
    const errors = await validateDto(UpdateRolesDto, {
      updates: [{ id: 'bad-id', name: 'Admin Updated' }],
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('UpdateRolesPermissionsDto: accepts valid nested payload', async () => {
    const errors = await validateDto(UpdateRolesPermissionsDto, {
      updates: [
        {
          roleId: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
          permissionKeys: ['users:read'],
        },
      ],
    });

    expect(errors).toHaveLength(0);
  });

  it('UpdateRolesPermissionsDto: rejects empty updates array', async () => {
    const errors = await validateDto(UpdateRolesPermissionsDto, {
      updates: [],
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('CreateCollaboratorsDto: accepts valid nested collaborators', async () => {
    const errors = await validateDto(CreateCollaboratorsDto, {
      collaborators: [
        {
          email: 'ana@empresa.com',
          firstName: 'Ana',
          lastName: 'Gomez',
          password: 'Secreto123',
          status: CollaboratorStatus.ACTIVE,
          roleKeys: ['admin'],
        },
      ],
    });

    expect(errors).toHaveLength(0);
  });

  it('CreateCollaboratorsDto: rejects non-array collaborators', async () => {
    const errors = await validateDto(CreateCollaboratorsDto, {
      collaborators: 'not-array',
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('CreateCollaboratorDto: accepts payload without optional status and roleKeys', async () => {
    const errors = await validateDto(CreateCollaboratorDto, {
      email: 'ana@empresa.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: 'Secreto123',
    });

    expect(errors).toHaveLength(0);
  });

  it('CreateCollaboratorDto: rejects duplicate roleKeys', async () => {
    const errors = await validateDto(CreateCollaboratorDto, {
      email: 'ana@empresa.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: 'Secreto123',
      roleKeys: ['admin', 'admin'],
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('UpdateCollaboratorStatusDto: accepts valid enum', async () => {
    const errors = await validateDto(UpdateCollaboratorStatusDto, {
      status: CollaboratorStatus.SUSPENDED,
    });

    expect(errors).toHaveLength(0);
  });

  it('UpdateCollaboratorStatusDto: rejects invalid enum value', async () => {
    const errors = await validateDto(UpdateCollaboratorStatusDto, {
      status: 'archived',
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('UpdateCollaboratorStatusDto: rejects missing status', async () => {
    const errors = await validateDto(UpdateCollaboratorStatusDto, {});

    expect(errors.length).toBeGreaterThan(0);
  });

  it('UpdateCollaboratorsDto: accepts valid bulk updates', async () => {
    const errors = await validateDto(UpdateCollaboratorsDto, {
      updates: [
        {
          id: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
          firstName: 'Mario',
        },
      ],
    });

    expect(errors).toHaveLength(0);
  });

  it('UpdateCollaboratorsDto: rejects empty updates', async () => {
    const errors = await validateDto(UpdateCollaboratorsDto, {
      updates: [],
    });

    expect(errors.length).toBeGreaterThan(0);
  });

  it('UpdateCollaboratorsRolesDto: accepts valid role keys', async () => {
    const errors = await validateDto(UpdateCollaboratorsRolesDto, {
      updates: [
        {
          id: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
          roleKeys: ['admin', 'operator'],
        },
      ],
    });

    expect(errors).toHaveLength(0);
  });

  it('UpdateCollaboratorsRolesDto: rejects duplicate role keys', async () => {
    const errors = await validateDto(UpdateCollaboratorsRolesDto, {
      updates: [
        {
          id: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
          roleKeys: ['admin', 'admin'],
        },
      ],
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});
