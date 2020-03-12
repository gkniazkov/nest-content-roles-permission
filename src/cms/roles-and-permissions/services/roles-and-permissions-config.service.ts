import { Injectable } from '@nestjs/common';
import { RoleEntity } from '../entities/role.entity';
import { PermissionEntity } from '../entities/permission.entity';
import { RolesAndPermissionsConfig } from '../data/roles-and-permissions-config.interface';

export enum RolesAndPermissionsPermissionsKeys {
  ViewRole = 'RolesAndPermissionsViewRole',
  AddRole = 'RolesAndPermissionsAddRole',
  EditRole = 'RolesAndPermissionsEditRole',
  RemoveRole = 'RolesAndPermissionsRemoveRole',
  ManagePermissions = 'RolesAndPermissionsManagePermissions',
}

export enum RolesAndPermissionsRolesName {
  Admin = 'Site Owner',
  Anonymous = 'Anonymous',
  User = 'User',
}

@Injectable()
export class RolesAndPermissionsConfigService implements RolesAndPermissionsConfig {

  public readonly MODULE_GROUP = 'Default';
  public readonly MODULE_ROLES_GROUP = 'Default';
  public readonly MODULE_PERMISSIONS_GROUP = 'Roles & Permissions';

  public readonly MODULE_ROLES = [
    new RoleEntity({
      name: RolesAndPermissionsRolesName.Admin,
      description: 'I am the Lizard King, I can do anything',
      group: this.MODULE_ROLES_GROUP,
      isDefault: true,
    }),
    new RoleEntity({
      name: RolesAndPermissionsRolesName.Anonymous,
      description: 'Base role for all anonymous users',
      group: this.MODULE_ROLES_GROUP,
      isDefault: true,
    }),
    new RoleEntity({
      name: RolesAndPermissionsRolesName.User,
      description: 'Base role for all authorized users',
      group: this.MODULE_ROLES_GROUP,
      isDefault: true,
    }),
  ];

  public readonly MODULE_PERMISSIONS = [
    new PermissionEntity({
      key: RolesAndPermissionsPermissionsKeys.ManagePermissions,
      description: 'Manage permissions',
      group: this.MODULE_PERMISSIONS_GROUP,
    }),
    new PermissionEntity({
      key: RolesAndPermissionsPermissionsKeys.ViewRole,
      description: 'View roles',
      group: this.MODULE_PERMISSIONS_GROUP,
    }),
    new PermissionEntity({
      key: RolesAndPermissionsPermissionsKeys.AddRole,
      description: 'Add roles',
      group: this.MODULE_PERMISSIONS_GROUP,
    }),
    new PermissionEntity({
      key: RolesAndPermissionsPermissionsKeys.EditRole,
      description: 'Edit roles',
      group: this.MODULE_PERMISSIONS_GROUP,
    }),
    new PermissionEntity({
      key: RolesAndPermissionsPermissionsKeys.RemoveRole,
      description: 'Remove roles',
      group: this.MODULE_PERMISSIONS_GROUP,
    }),
  ];

}
