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

export abstract class IAccessUseCase {
  abstract syncPermissions(
    tree: PermissionTreeNode[],
  ): Promise<SyncPermissionsResult>;
  abstract getPermissionsTree(): Promise<PermissionTreeSummary[]>;
  abstract getRoles(): Promise<RoleSummary[]>;
  abstract createRole(params: {
    key: string;
    name: string;
    description?: string;
    isDefault?: boolean;
    permissionKeys?: string[];
  }): Promise<RoleSummary>;
  abstract updateRolePermissions(
    roleId: string,
    permissionKeys: string[],
  ): Promise<RoleSummary>;
}
