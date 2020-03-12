import { Injectable } from '@nestjs/common';
import { PermissionEntity } from '../../roles-and-permissions/entities/permission.entity';
import { RolesAndPermissionsConfig } from '../../roles-and-permissions/data/roles-and-permissions-config.interface';

export enum UsersPermissionsKeys {
  AddUser = 'UsersAddUser',
  EditAnyUser = 'UsersEditAnyUser',
  EditSelfUser = 'UsersEditSelfUser',
  ViewAnyUser = 'UsersViewAnyUser',
  ViewSelfUser = 'UsersViewSelfUser',
  RemoveAnyUser = 'UsersRemoveAnyUser',
  RemoveSelfUser = 'UsersRemoveSelfUser',
  CreateDelegatedUsers = 'UsersCreateDelegatedUsers',
}

@Injectable()
export class UsersConfigService implements RolesAndPermissionsConfig {
  public readonly MODULE_GROUP = 'Users';

  public readonly MODULE_ROLES = [];

  public readonly MODULE_PERMISSIONS = [
    new PermissionEntity({
      key: UsersPermissionsKeys.AddUser,
      description: 'Add Users',
      group: this.MODULE_GROUP,
    }),
    new PermissionEntity({
      key: UsersPermissionsKeys.EditAnyUser,
      description: 'Edit users account info (username, password)',
      group: this.MODULE_GROUP,
    }),
    new PermissionEntity({
      key: UsersPermissionsKeys.EditSelfUser,
      description: 'Edit own account info (username, password)',
      group: this.MODULE_GROUP,
    }),
    new PermissionEntity({
      key: UsersPermissionsKeys.ViewAnyUser,
      description: 'View users account info',
      group: this.MODULE_GROUP,
    }),
    new PermissionEntity({
      key: UsersPermissionsKeys.ViewSelfUser,
      description: 'View own account info',
      group: this.MODULE_GROUP,
    }),
    new PermissionEntity({
      key: UsersPermissionsKeys.RemoveAnyUser,
      description: 'Delete any accounts',
      group: this.MODULE_GROUP,
    }),
    new PermissionEntity({
      key: UsersPermissionsKeys.RemoveSelfUser,
      description: 'Remove own account',
      group: this.MODULE_GROUP,
    }),
    new PermissionEntity({
      key: UsersPermissionsKeys.CreateDelegatedUsers,
      description: 'Create/Edit/Remove delegated users',
      group: this.MODULE_GROUP,
    }),
  ];
}
