import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Type,
  UnauthorizedException,
  mixin,
} from '@nestjs/common';
import { RolesAndPermissionsService } from '../services/roles-and-permissions.service';

export const PermissionsGuard: (
  permissionNameFn: (isOwner: boolean) => string,
) => Type<CanActivate> = memoize(createPermissionsGuard);

function createPermissionsGuard(permissionNameFn: (isOwner: boolean) => string): Type<CanActivate> {

  @Injectable()
  class MixinAuthGuard implements CanActivate {

    constructor(
      private rolesAndPermissions: RolesAndPermissionsService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {

      const request = context.switchToHttp().getRequest();
      const user = request.user;
      const permission = await this.rolesAndPermissions
        .getPermissionByKey(permissionNameFn(request.isOwner));
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
