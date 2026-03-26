import {
  IAccessUseCase,
  PermissionSummary,
  PermissionTreeSummary,
  RoleSummary,
  SyncPermissionsResult,
} from 'src/contexts/iam/domain/use-cases/access-use-case.interface';
import { AccessController } from 'src/contexts/iam/infrastructure/http-api/v1/access/controllers/access.controller';

describe('AccessController', () => {
  let controller: AccessController;

  const accessUseCase = {
    syncPermissions: jest.fn(),
    getPermissionsTree: jest.fn(),
    getPermissions: jest.fn(),
    getRoles: jest.fn(),
    createRole: jest.fn(),
    updateRole: jest.fn(),
    updateRoles: jest.fn(),
    updateRolePermissionsBulk: jest.fn(),
    updateRolePermissions: jest.fn(),
    deleteRole: jest.fn(),
  } as unknown as jest.Mocked<IAccessUseCase>;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AccessController(accessUseCase);
  });

  it('syncPermissions: returns sync summary', async () => {
    const summary: SyncPermissionsResult = {
      created: 2,
      updated: 1,
      removed: 0,
      total: 3,
    };
    accessUseCase.syncPermissions.mockResolvedValue(summary);

    const permissions = [{ key: 'users', description: 'Users', children: [] }];
    const result = await controller.syncPermissions({ permissions });

    expect(result).toEqual(summary);
    expect(accessUseCase.syncPermissions).toHaveBeenCalledWith(permissions);
  });

  it('syncPermissions: propagates use-case errors', async () => {
    const error = new Error('invalid permissions');
    accessUseCase.syncPermissions.mockRejectedValue(error);

    await expect(
      controller.syncPermissions({ permissions: [] }),
    ).rejects.toThrow(error);
  });

  it('getPermissionsTree: returns tree', async () => {
    const tree: PermissionTreeSummary[] = [
      {
        id: 'p1',
        key: 'users',
        resource: 'users',
        action: 'all',
        children: [],
      },
    ];
    accessUseCase.getPermissionsTree.mockResolvedValue(tree);

    const result = await controller.getPermissionsTree();

    expect(result).toEqual(tree);
    expect(accessUseCase.getPermissionsTree).toHaveBeenCalledTimes(1);
  });

  it('getPermissions: returns flat permissions', async () => {
    const permissions: PermissionSummary[] = [
      {
        id: 'p1',
        key: 'users:read',
        resource: 'users',
        action: 'read',
        parentId: null,
      },
    ];
    accessUseCase.getPermissions.mockResolvedValue(permissions);

    const result = await controller.getPermissions();

    expect(result).toEqual(permissions);
    expect(accessUseCase.getPermissions).toHaveBeenCalledTimes(1);
  });

  it('getRoles: returns role list', async () => {
    const roles: RoleSummary[] = [
      {
        id: 'r1',
        key: 'admin',
        name: 'Admin',
        description: 'Administrator',
        isDefault: false,
        permissions: ['users:read'],
      },
    ];
    accessUseCase.getRoles.mockResolvedValue(roles);

    const result = await controller.getRoles();

    expect(result).toEqual(roles);
    expect(accessUseCase.getRoles).toHaveBeenCalledTimes(1);
  });

  it('createRole: maps dto to use-case input', async () => {
    const role: RoleSummary = {
      id: 'r1',
      key: 'admin',
      name: 'Admin',
      description: 'Administrator',
      isDefault: false,
      permissions: [],
    };
    accessUseCase.createRole.mockResolvedValue(role);

    const body = {
      key: 'admin',
      name: 'Admin',
      description: 'Administrator',
      isDefault: false,
      permissionKeys: ['users:read'],
    };
    const result = await controller.createRole(body);

    expect(result).toEqual(role);
    expect(accessUseCase.createRole).toHaveBeenCalledWith(body);
  });

  it('createRole: propagates use-case errors', async () => {
    const error = new Error('role exists');
    accessUseCase.createRole.mockRejectedValue(error);

    await expect(
      controller.createRole({
        key: 'admin',
        name: 'Admin',
        description: 'Administrator',
        isDefault: false,
        permissionKeys: ['users:read'],
      }),
    ).rejects.toThrow(error);
  });

  it('updateRole: maps params to use-case', async () => {
    const updatedRole: RoleSummary = {
      id: 'r1',
      key: 'admin',
      name: 'Admin Updated',
      description: 'Updated',
      isDefault: false,
      permissions: [],
    };
    accessUseCase.updateRole.mockResolvedValue(updatedRole);

    const result = await controller.updateRole('r1', {
      name: 'Admin Updated',
      description: 'Updated',
    });

    expect(result).toEqual(updatedRole);
    expect(accessUseCase.updateRole).toHaveBeenCalledWith('r1', {
      key: undefined,
      name: 'Admin Updated',
      description: 'Updated',
      isDefault: undefined,
    });
  });

  it('updateRoles: delegates to bulk update use-case', async () => {
    const updatedRoles: RoleSummary[] = [
      {
        id: 'r1',
        key: 'admin',
        name: 'Admin Updated',
        description: 'Updated',
        isDefault: false,
        permissions: [],
      },
    ];
    accessUseCase.updateRoles.mockResolvedValue(updatedRoles);

    const updates = [{ id: 'r1', name: 'Admin Updated' }];
    const result = await controller.updateRoles({ updates });

    expect(result).toEqual(updatedRoles);
    expect(accessUseCase.updateRoles).toHaveBeenCalledWith(updates);
  });

  it('updateRolePermissionsBulk: delegates to use-case', async () => {
    const updatedRoles: RoleSummary[] = [
      {
        id: 'r1',
        key: 'admin',
        name: 'Admin',
        description: 'Administrator',
        isDefault: false,
        permissions: ['users:read'],
      },
    ];
    accessUseCase.updateRolePermissionsBulk.mockResolvedValue(updatedRoles);

    const updates = [{ roleId: 'r1', permissionKeys: ['users:read'] }];
    const result = await controller.updateRolePermissionsBulk({ updates });

    expect(result).toEqual(updatedRoles);
    expect(accessUseCase.updateRolePermissionsBulk).toHaveBeenCalledWith(
      updates,
    );
  });

  it('updateRolePermissions: delegates with role id and permission keys', async () => {
    const role: RoleSummary = {
      id: 'r1',
      key: 'admin',
      name: 'Admin',
      description: 'Administrator',
      isDefault: false,
      permissions: ['users:read'],
    };
    accessUseCase.updateRolePermissions.mockResolvedValue(role);

    const result = await controller.updateRolePermissions('r1', {
      permissionKeys: ['users:read'],
    });

    expect(result).toEqual(role);
    expect(accessUseCase.updateRolePermissions).toHaveBeenCalledWith('r1', [
      'users:read',
    ]);
  });

  it('updateRolePermissions: propagates use-case errors', async () => {
    const error = new Error('invalid role id');
    accessUseCase.updateRolePermissions.mockRejectedValue(error);

    await expect(
      controller.updateRolePermissions('bad-id', {
        permissionKeys: ['users:read'],
      }),
    ).rejects.toThrow(error);
  });

  it('deleteRole: returns deleted true', async () => {
    accessUseCase.deleteRole.mockResolvedValue(undefined);

    const result = await controller.deleteRole('r1');

    expect(result).toEqual({ deleted: true });
    expect(accessUseCase.deleteRole).toHaveBeenCalledWith('r1');
  });

  it('deleteRole: propagates use-case errors', async () => {
    const error = new Error('role not found');
    accessUseCase.deleteRole.mockRejectedValue(error);

    await expect(controller.deleteRole('missing')).rejects.toThrow(error);
  });
});
