import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Type,
  UnauthorizedException,
  mixin,
} from '@nestjs/common';
import { RolesAndPermissionsService } from '../../roles-and-permissions/services/roles-and-permissions.service';
import { ContentPermissionHelper, ContentPermissionsKeys } from '../../roles-and-permissions/misc/content-permission-helper';
import { UserEntity } from '../../users/entities/user.entity';
import { ContentEntity } from '../entities/content.entity';

@Injectable()
export class ContentViewUnpublishedPermissionsGuard implements CanActivate {
  constructor(
    private rolesAndPermissions: RolesAndPermissionsService,
    private contentPermissionsHelper: ContentPermissionHelper,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: UserEntity = request.user;
    const entity: ContentEntity = request.contentEntity;
    const isOwner = request.contentEntity ? request.contentEntity.constructor.ownerFields
      .reduce((res, field: string) => {
        const ownerId = field
          .split('.')
          .reduce((obj, part) => {
            return obj[part] || {};
          }, request.contentEntity);
        return res || ownerId === user.id;
      }, false) : false;
    if (entity.isPublished || isOwner) {
      return true;
    }
    const permission = await this.rolesAndPermissions
      .getPermissionByKey(
        this.contentPermissionsHelper.getKeyByContentName(
          ContentPermissionsKeys[ContentPermissionsKeys.ContentViewUnpublished],
          (context.getClass() as any).entityName,
        ),
      );
    const permissionGranted = await this.rolesAndPermissions
      .checkPermissionByRoles(permission, user.roles);
    if (permissionGranted) {
      return true;
    } else {
      throw new UnauthorizedException();
    }
  }
}
