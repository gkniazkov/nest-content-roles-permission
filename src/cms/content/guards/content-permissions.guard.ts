import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Type,
  UnauthorizedException,
  mixin,
} from '@nestjs/common';
import { RolesAndPermissionsService } from '../../roles-and-permissions/services/roles-and-permissions.service';
import { ContentPermissionHelper } from '../../roles-and-permissions/misc/content-permission-helper';

export const ContentPermissionsGuard: (
  permissionKeyFn: (isOwner: boolean) => string,
) => Type<CanActivate> = memoize(createPermissionsGuard);

function createPermissionsGuard(permissionKeyFn: (isOwner: boolean) => string): Type<CanActivate> {

  @Injectable()
  class MixinAuthGuard implements CanActivate {

    constructor(
      private rolesAndPermissions: RolesAndPermissionsService,
      private contentPermissionsHelper: ContentPermissionHelper,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const isOwner = request.contentEntity ? request.contentEntity.constructor.ownerFields
        .reduce((res, field: string) => {
          const ownerId = field
            .split('.')
            .reduce((obj, part) => {
              return obj[part] || {};
            }, request.contentEntity);
          return res || ownerId === user.id;
        }, false) : false;
      const permissionName = this.contentPermissionsHelper.getKeyByContentName(
        permissionKeyFn(isOwner),
        (context.getClass() as any).entityName);
      const permission = await this.rolesAndPermissions
        .getPermissionByKey(permissionName);
      const permissionGranted = await this.rolesAndPermissions
        .checkPermissionByRoles(permission, user.roles);
      if (permissionGranted) {
        return true;
      } else {
        throw new UnauthorizedException();
      }
    }
  }
  const guard = mixin(MixinAuthGuard);
  return guard;
}

export function memoize(fn: Function) {
  const defaultKey = 'default';
  const cache = {};
  return (...args) => {
    const n = args[0];
    const cacheKey = n(false) + '_' + n(true);
    if (cacheKey in cache) {
      return cache[cacheKey];
    } else {
      const result = fn(n === defaultKey ? undefined : n);
      cache[cacheKey] = result;
      return result;
    }
  };
}
