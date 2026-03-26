import { HttpStatus, Injectable } from '@nestjs/common';
import {
  IAccessUseCase,
  PermissionTreeNode,
  PermissionSummary,
  PermissionTreeSummary,
  RoleSummary,
  SyncPermissionsResult,
  UpdateRoleBulkItem,
  UpdateRoleInput,
  UpdateRolePermissionsBulkItem,
} from 'src/contexts/iam/domain/use-cases/access-use-case.interface';
import {
  IPermissionRepository,
  PermissionSyncInput,
} from 'src/contexts/shared/domain/repositories/permission.repository.interface';
import { IRoleRepository } from 'src/contexts/shared/domain/repositories/role.repository.interface';
import { FoodaException } from 'src/contexts/shared/domain/exceptions/fooda.exception';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';
import { Role } from 'src/contexts/shared/domain/entities';
import {
  findDuplicateString,
  isUuid,
} from 'src/contexts/iam/application/helpers/validation.helper';

@Injectable()
export class AccessService implements IAccessUseCase {
  constructor(
    private readonly permissionRepository: IPermissionRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  async syncPermissions(
    tree: PermissionTreeNode[],
  ): Promise<SyncPermissionsResult> {
    const flattened = this.flattenPermissions(tree);
    const result = await this.permissionRepository.syncPermissions(flattened);

    return {
      ...result,
      total: flattened.length,
    };
  }

  async getPermissions(): Promise<PermissionSummary[]> {
    const permissions = await this.permissionRepository.findAll();
    return permissions
      .map((permission) => ({
        id: permission.id,
        key: permission.key,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        parentId: permission.parentId,
      }))
      .sort((left, right) => left.key.localeCompare(right.key));
  }

  async getPermissionsTree(): Promise<PermissionTreeSummary[]> {
    const permissions = await this.permissionRepository.findAllWithHierarchy();
    const nodeMap = new Map<string, PermissionTreeSummary>();

    for (const permission of permissions) {
      nodeMap.set(permission.id, {
        id: permission.id,
        key: permission.key,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        children: [],
      });
    }

    const roots: PermissionTreeSummary[] = [];
    for (const permission of permissions) {
      const node = nodeMap.get(permission.id);
      if (!node) continue;

      if (permission.parentId) {
        const parentNode = nodeMap.get(permission.parentId);
        if (parentNode) {
          parentNode.children.push(node);
          continue;
        }
      }

      roots.push(node);
    }

    const sortTree = (nodes: PermissionTreeSummary[]) => {
      nodes.sort((left, right) => left.key.localeCompare(right.key));
      for (const node of nodes) {
        sortTree(node.children);
      }
    };

    sortTree(roots);
    return roots;
  }

  async getRoles(): Promise<RoleSummary[]> {
    const roles = await this.roleRepository.findAllWithPermissions();
    return roles.map((role) => this.toRoleSummary(role));
  }

  async createRole(params: {
    key: string;
    name: string;
    description?: string;
    isDefault?: boolean;
    permissionKeys?: string[];
  }): Promise<RoleSummary> {
    const existingRole = await this.roleRepository.findByKey(params.key);
    if (existingRole) {
      throw new FoodaException(FoodaExceptionCodes.Ex1053, HttpStatus.CONFLICT);
    }

    const createdRole = await this.roleRepository.save({
      key: params.key,
      name: params.name,
      description: params.description,
      isDefault: params.isDefault ?? false,
    });

    if (params.permissionKeys && params.permissionKeys.length > 0) {
      await this.assignPermissionsToRole(createdRole.id, params.permissionKeys);
    }

    const roleWithPermissions = await this.roleRepository.findWithPermissions(
      createdRole.id,
    );

    if (!roleWithPermissions) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1054,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toRoleSummary(roleWithPermissions);
  }

  async updateRolePermissions(
    roleId: string,
    permissionKeys: string[],
  ): Promise<RoleSummary> {
    if (!isUuid(roleId)) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1060,
        HttpStatus.BAD_REQUEST,
      );
    }

    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1054,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.assignPermissionsToRole(roleId, permissionKeys);

    const roleWithPermissions =
      await this.roleRepository.findWithPermissions(roleId);

    if (!roleWithPermissions) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1054,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toRoleSummary(roleWithPermissions);
  }

  async updateRole(
    roleId: string,
    params: UpdateRoleInput,
  ): Promise<RoleSummary> {
    if (!isUuid(roleId)) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1060,
        HttpStatus.BAD_REQUEST,
      );
    }

    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1054,
        HttpStatus.NOT_FOUND,
      );
    }

    if (params.key && params.key !== role.key) {
      const existingByKey = await this.roleRepository.findByKey(params.key);
      if (existingByKey && existingByKey.id !== roleId) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1053,
          HttpStatus.CONFLICT,
        );
      }
    }

    const updatePayload: Partial<Role> = {};
    if (params.key !== undefined) updatePayload.key = params.key;
    if (params.name !== undefined) updatePayload.name = params.name;
    if (params.description !== undefined)
      updatePayload.description = params.description;
    if (params.isDefault !== undefined)
      updatePayload.isDefault = params.isDefault;

    await this.roleRepository.update(roleId, updatePayload);

    const roleWithPermissions =
      await this.roleRepository.findWithPermissions(roleId);
    if (!roleWithPermissions) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1054,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toRoleSummary(roleWithPermissions);
  }

  async updateRoles(updates: UpdateRoleBulkItem[]): Promise<RoleSummary[]> {
    const roleIds = updates.map((update) => update.id);
    for (const roleId of roleIds) {
      if (!isUuid(roleId)) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1060,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const providedKeys = updates
      .filter((update) => update.key !== undefined)
      .map((update) => update.key as string);

    const duplicatedKeyInPayload = findDuplicateString(providedKeys);
    if (duplicatedKeyInPayload) {
      throw new FoodaException(FoodaExceptionCodes.Ex1053, HttpStatus.CONFLICT);
    }

    for (const roleId of roleIds) {
      const role = await this.roleRepository.findById(roleId);
      if (!role) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1054,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    for (const update of updates) {
      if (!update.key) continue;
      const existingByKey = await this.roleRepository.findByKey(update.key);
      if (existingByKey && existingByKey.id !== update.id) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1053,
          HttpStatus.CONFLICT,
        );
      }
    }

    await this.roleRepository.bulkUpdateRoles(updates);

    const results: RoleSummary[] = [];
    for (const roleId of roleIds) {
      const roleWithPermissions =
        await this.roleRepository.findWithPermissions(roleId);
      if (!roleWithPermissions) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1054,
          HttpStatus.NOT_FOUND,
        );
      }
      results.push(this.toRoleSummary(roleWithPermissions));
    }

    return results;
  }

  async updateRolePermissionsBulk(
    updates: UpdateRolePermissionsBulkItem[],
  ): Promise<RoleSummary[]> {
    const roleIds = updates.map((update) => update.roleId);
    for (const roleId of roleIds) {
      if (!isUuid(roleId)) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1060,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    for (const roleId of roleIds) {
      const role = await this.roleRepository.findById(roleId);
      if (!role) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1054,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const allPermissionKeys = [
      ...new Set(updates.flatMap((u) => u.permissionKeys)),
    ];

    const permissions =
      await this.permissionRepository.findByKeys(allPermissionKeys);
    if (permissions.length !== allPermissionKeys.length) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1055,
        HttpStatus.BAD_REQUEST,
      );
    }

    const permissionByKey = new Map(
      permissions.map((permission) => [permission.key, permission]),
    );
    const updatesWithPermissionIds = updates.map((update) => ({
      roleId: update.roleId,
      permissionIds: update.permissionKeys.map((permissionKey) => {
        const permission = permissionByKey.get(permissionKey);
        if (!permission) {
          throw new FoodaException(
            FoodaExceptionCodes.Ex1055,
            HttpStatus.BAD_REQUEST,
          );
        }
        return permission.id;
      }),
    }));

    await this.roleRepository.bulkUpdateRolePermissions(
      updatesWithPermissionIds,
    );

    const results: RoleSummary[] = [];
    for (const roleId of roleIds) {
      const roleWithPermissions =
        await this.roleRepository.findWithPermissions(roleId);
      if (!roleWithPermissions) {
        throw new FoodaException(
          FoodaExceptionCodes.Ex1054,
          HttpStatus.NOT_FOUND,
        );
      }
      results.push(this.toRoleSummary(roleWithPermissions));
    }

    return results;
  }

  async deleteRole(roleId: string): Promise<void> {
    if (!isUuid(roleId)) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1060,
        HttpStatus.BAD_REQUEST,
      );
    }

    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1054,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.roleRepository.deleteRoleWithRelations(roleId);
  }

  private flattenPermissions(
    tree: PermissionTreeNode[],
  ): PermissionSyncInput[] {
    const result: PermissionSyncInput[] = [];

    const visit = (node: PermissionTreeNode, parentKey?: string) => {
      const [resource, action] = this.splitPermissionKey(node.key);
      result.push({
        key: node.key,
        resource,
        action,
        description: node.description,
        parentKey,
      });

      for (const child of node.children ?? []) {
        visit(child, node.key);
      }
    };

    for (const node of tree) {
      visit(node);
    }

    return result;
  }

  private splitPermissionKey(key: string): [string, string] {
    const [resource, action] = key.split(':');
    if (!resource || !action) {
      return [key, 'manage'];
    }
    return [resource, action];
  }

  private async assignPermissionsToRole(
    roleId: string,
    permissionKeys: string[],
  ): Promise<void> {
    const permissions =
      await this.permissionRepository.findByKeys(permissionKeys);
    if (permissions.length !== permissionKeys.length) {
      throw new FoodaException(
        FoodaExceptionCodes.Ex1055,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.roleRepository.updateRolePermissions(
      roleId,
      permissions.map((permission) => permission.id),
    );
  }

  private toRoleSummary(role: Role): RoleSummary {
    return {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      isDefault: role.isDefault,
      permissions: (role.rolePermissions ?? [])
        .map((rolePermission) => rolePermission.permission?.key)
        .filter((key): key is string => !!key),
    };
  }
}
