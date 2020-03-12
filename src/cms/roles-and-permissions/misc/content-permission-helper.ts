import { Injectable } from '@nestjs/common';
import { PermissionEntity } from '../entities/permission.entity';
import { RoleEntity } from '../entities/role.entity';

export enum ContentPermissionsKeys {
  // ContentAdd, ContentViewPublished, ContentViewUnpublished,
  // ContentViewOwn, ContentViewAll,
  // ContentEdit, ContentEditOwn, ContentRemove, ContentRemoveOwn,
  'ContentAdd',
  'ContentViewPublished',
  'ContentViewUnpublished',
  'ContentViewOwn',
  'ContentViewAll',
  'ContentEdit',
  'ContentEditOwn',
  'ContentRemove',
  'ContentRemoveOwn',
}

export enum CommentPermissionsKeys {
  // CommentAdd, CommentViewPublished, CommentViewUnpublished,
  // CommentEdit, CommentEditOwn, CommentRemove, CommentRemoveOwn,
  'CommentAdd',
  'CommentViewPublished',
  'CommentViewUnpublished',
  'CommentEdit',
  'CommentEditOwn',
  'CommentRemove',
  'CommentRemoveOwn',
}

@Injectable()
export class ContentPermissionHelper {

  private readonly messages = {
    [ContentPermissionsKeys[ContentPermissionsKeys.ContentAdd]]: 'Add',
    [ContentPermissionsKeys[ContentPermissionsKeys.ContentViewPublished]]: 'View published',
    [ContentPermissionsKeys[ContentPermissionsKeys.ContentViewUnpublished]]: 'View unpublished',
    [ContentPermissionsKeys[ContentPermissionsKeys.ContentViewOwn]]: 'View own',
    [ContentPermissionsKeys[ContentPermissionsKeys.ContentViewAll]]: 'View all',
    [ContentPermissionsKeys[ContentPermissionsKeys.ContentEdit]]: 'Edit',
    [ContentPermissionsKeys[ContentPermissionsKeys.ContentEditOwn]]: 'Edit own',
    [ContentPermissionsKeys[ContentPermissionsKeys.ContentRemove]]: 'Remove',
    [ContentPermissionsKeys[ContentPermissionsKeys.ContentRemoveOwn]]: 'Remove own',

    [CommentPermissionsKeys[CommentPermissionsKeys.CommentAdd]]: 'Add comments for',
    [CommentPermissionsKeys[CommentPermissionsKeys.CommentViewPublished]]: 'View published comments for',
    [CommentPermissionsKeys[CommentPermissionsKeys.CommentViewUnpublished]]: 'View unpublished comments for',
    [CommentPermissionsKeys[CommentPermissionsKeys.CommentEdit]]: 'Edit comments for',
    [CommentPermissionsKeys[CommentPermissionsKeys.CommentEditOwn]]: 'Edit own comments for',
    [CommentPermissionsKeys[CommentPermissionsKeys.CommentRemove]]: 'Remove comments for',
    [CommentPermissionsKeys[CommentPermissionsKeys.CommentRemoveOwn]]: 'Remove own comments for',
  };

  getContentPermissions(contentEntity: Function, group: string = null) {
    const contentName = contentEntity.name;
    const humanContentName = this.getHumanContentName(contentName);
    let permissionsKeys = [...this.getKeys(ContentPermissionsKeys)];
    if ((contentEntity as any).useComment) {
      permissionsKeys = [...permissionsKeys, ...this.getKeys(CommentPermissionsKeys)];
    }
    return permissionsKeys.map(key => {
      return new PermissionEntity({
        key: this.getKeyByContentName(key, contentName),
        description: this.getDescription(key as any, humanContentName),
        group: group || humanContentName,
      });
    });
  }

  public getKeyByContentName(key, contentName) {
    return `${key}${contentName}`;
  }

  public getHumanContentName(contentName: string): string {
    return contentName.split(/(?=[A-Z])/).join(' ');
  }

  public getDescription(key: ContentPermissionsKeys | CommentPermissionsKeys, humanContentName: string): string {
    let message = this.messages[key];
    return `${message} ${humanContentName}`;
  }

  public getKeys(keysEnum): string[] {
    return Object.keys(keysEnum).filter(key => isNaN(Number(key)));
  }

  public getKeyAsString(key: ContentPermissionsKeys): string {
    return ContentPermissionsKeys[key];
  }

  public getPermissionRoleKey(
    permKey: string | PermissionEntity,
    roleName: string | RoleEntity,
  ) {
    permKey = typeof permKey === 'string' ? permKey : permKey.key;
    roleName = typeof roleName === 'string' ? roleName : roleName.name;
    return `${permKey}_${roleName}`;
  }

}
