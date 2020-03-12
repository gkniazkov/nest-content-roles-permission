import { RoleEntity } from '../entities/role.entity';
import { PermissionEntity } from '../entities/permission.entity';

export interface RolesAndPermissionsConfig {
  readonly MODULE_GROUP: string;
  readonly MODULE_ROLES_GROUP?: string;
  readonly MODULE_PERMISSIONS_GROUP?: string;
  readonly MODULE_ROLES?: RoleEntity[];
  readonly MODULE_PERMISSIONS?: PermissionEntity[];
  readonly MODULE_CONTENTS?: Function[];
  readonly MODULE_DEFAULT_PERMISSION_ROLES?: {
    [key: string]: boolean;
  };
}
