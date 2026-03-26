export type PermissionTreeNode = {
  key: string;
  description?: string;
  children?: PermissionTreeNode[];
};

export type PermissionTreeSummary = {
  id: string;
  key: string;
  resource: string;
  action: string;
  description?: string;
  children: PermissionTreeSummary[];
};

export type PermissionSummary = {
  id: string;
  key: string;
  resource: string;
  action: string;
  description?: string;
  parentId?: string | null;
};

export type RoleSummary = {
  id: string;
  key: string;
  name: string;
  description?: string;
  isDefault: boolean;
  permissions: string[];
};

export type SyncPermissionsResult = {
  created: number;
  updated: number;
  removed: number;
  total: number;
};

export type UpdateRoleInput = {
  key?: string;
  name?: string;
  description?: string;
  isDefault?: boolean;
};

export type UpdateRoleBulkItem = UpdateRoleInput & {
  id: string;
};

export type UpdateRolePermissionsBulkItem = {
  roleId: string;
  permissionKeys: string[];
};

export abstract class IAccessUseCase {
  abstract syncPermissions(
    tree: PermissionTreeNode[],
  ): Promise<SyncPermissionsResult>;
  abstract getPermissions(): Promise<PermissionSummary[]>;
  abstract getPermissionsTree(): Promise<PermissionTreeSummary[]>;
  abstract getRoles(): Promise<RoleSummary[]>;
  abstract createRole(params: {
    key: string;
    name: string;
    description?: string;
    isDefault?: boolean;
    permissionKeys?: string[];
  }): Promise<RoleSummary>;
  abstract updateRole(
    roleId: string,
    params: UpdateRoleInput,
  ): Promise<RoleSummary>;
  abstract updateRoles(updates: UpdateRoleBulkItem[]): Promise<RoleSummary[]>;
  abstract updateRolePermissions(
    roleId: string,
    permissionKeys: string[],
  ): Promise<RoleSummary>;
  abstract updateRolePermissionsBulk(
    updates: UpdateRolePermissionsBulkItem[],
  ): Promise<RoleSummary[]>;
  abstract deleteRole(roleId: string): Promise<void>;
}
