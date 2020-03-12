import { Body, Delete, Get, Param, Post, Put, Query, Req, UnauthorizedException, UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { Brackets, Repository } from 'typeorm';
import { ContentEntity } from '../entities/content.entity';
import { ContentPermissionsGuard } from '../guards/content-permissions.guard';
import { ContentPermissionHelper, ContentPermissionsKeys } from '../../roles-and-permissions/misc/content-permission-helper';
import { User } from '../../users/decorators/user.decorator';
import { UserEntity } from '../../users/entities/user.entity';
import { RolesAndPermissionsService } from '../../roles-and-permissions/services/roles-and-permissions.service';
import { ContentEntityNotFoundGuard } from '../guards/content-entity-not-found.guard';
import { ContentViewUnpublishedPermissionsGuard } from '../guards/content-view-unpublished-permission.guard';
import { ContentEntityParam } from '../decorators/content-entity-param.decorator';

export class CrudController {

  constructor(
    protected rolesAndPermissions: RolesAndPermissionsService,
    protected contentPermissionsHelper: ContentPermissionHelper,
  ) {}

  protected repository: Repository<ContentEntity>;

  @Get('')
  async loadContentEntities(@User() user: UserEntity, @Query() query) {
    const builder = await this.getQueryBuilder(user, query);
    return builder.getMany();
  }

  @Get(':id')
  @UseGuards(ContentViewUnpublishedPermissionsGuard)
  @UseGuards(ContentPermissionsGuard(isOwner => {
    if (isOwner) {
      return ContentPermissionsKeys[ContentPermissionsKeys.ContentViewOwn];
    } else {
      return ContentPermissionsKeys[ContentPermissionsKeys.ContentViewAll];
    }
  }))
  @UseGuards(ContentEntityNotFoundGuard)
  loadContentEntity(@ContentEntityParam() entity: ContentEntity) {
    return entity;
  }

  @Post('')
  @UseGuards(ContentPermissionsGuard(isOwner => ContentPermissionsKeys[ContentPermissionsKeys.ContentAdd]))
  async createContentEntity(@Body() entity: ContentEntity, @User() user: UserEntity) {
    if (user.isAuthorized()) {
      entity.authorId = user.id;
      entity.moderatorId = user.id;
    } else {
      entity.authorId = null;
      entity.moderatorId = null;
    }
    // const validateResult = await entity.validate();
    const validateResult = true;
    if (validateResult === true) {
      return await this.repository.save(entity);
    } else {
      throw new UnprocessableEntityException(validateResult);
    }
  }

  @Put(':id')
  @UseGuards(ContentPermissionsGuard(isOwner => {
    if (isOwner) {
      return ContentPermissionsKeys[ContentPermissionsKeys.ContentEditOwn];
    } else {
      return ContentPermissionsKeys[ContentPermissionsKeys.ContentEdit];
    }
  }))
  @UseGuards(ContentEntityNotFoundGuard)
  async updateContentEntity(
    @User() user: UserEntity,
    @ContentEntityParam() currentEntity: ContentEntity,
    @Body() newEntity: ContentEntity,
  ) {
    newEntity.id = currentEntity.id;
    newEntity.authorId = currentEntity.authorId;
    newEntity.moderatorId = user.id;
    Object.assign(currentEntity, newEntity);
    // const validateResult = await currentEntity.validate();
    const validateResult = true;
    if (validateResult === true) {
      return await this.repository.save(currentEntity);
    } else {
      throw new UnprocessableEntityException(validateResult);
    }
  }

  @Delete(':id')
  @UseGuards(ContentPermissionsGuard(isOwner => {
    if (isOwner) {
      return ContentPermissionsKeys[ContentPermissionsKeys.ContentRemoveOwn];
    } else {
      return ContentPermissionsKeys[ContentPermissionsKeys.ContentRemove];
    }
  }))
  @UseGuards(ContentEntityNotFoundGuard)
  async deleteContentEntity(@Param('id') id: number) {
    const entity = await this.repository.findOne({ id });
    return await this.repository.remove(entity);
  }

  async getWhereRestrictionsByPermissions(user: UserEntity) {

    const entityName = (this.constructor as any).entityFn.name;
    const entityFn = (this.constructor as any).entityFn;

    const permissions: {
      viewAll?: boolean,
      viewUnpublished?: boolean,
      viewOwn?: boolean,
    } = {};

    permissions.viewAll = await this.checkPermissionGranted(
      ContentPermissionsKeys.ContentViewAll,
      entityName,
      user,
    );

    permissions.viewUnpublished = await this.checkPermissionGranted(
      ContentPermissionsKeys.ContentViewUnpublished,
      entityName,
      user,
    );

    permissions.viewOwn = await this.checkPermissionGranted(
      ContentPermissionsKeys.ContentViewOwn,
      entityName,
      user,
    );

    if (permissions.viewAll || permissions.viewOwn) {
      const where: Partial<ContentEntity> = {};
      if (permissions.viewAll) {
        if (!permissions.viewUnpublished) {
          where.isPublished = true;
        }
      } else {
        entityFn.ownerFields.forEach((field: string) => {
          where[field] = user.id;
        });
      }
      return where;
    } else {
      return false;
    }
  }

  private async checkPermissionGranted(key: ContentPermissionsKeys, entityName: string, user: UserEntity) {
    const permission = await this.rolesAndPermissions
      .getPermissionByKey(
        this.contentPermissionsHelper
          .getKeyByContentName(
            ContentPermissionsKeys[key],
            entityName,
          ),
      );
    return await this.rolesAndPermissions
      .checkPermissionByRoles(permission, user.roles);
  }

  protected async getQueryBuilder(user: UserEntity, query: any, skipPermission = false) {
    const extraWhere = await this.getWhereRestrictionsByPermissions(user);
    if (extraWhere === false && !skipPermission) {
      throw new UnauthorizedException();
    }
    const builder = this.repository
      .createQueryBuilder('entity');

    const ownerFields = (this.constructor as any).entityFn.ownerFields as string[];
    const hasOwnerFields = ownerFields.reduce((res, field) => {
      return res && typeof extraWhere[field] !== 'undefined';
    }, true);

    if (extraWhere && hasOwnerFields) {
      builder.where(new Brackets(sqb => {
        ownerFields.forEach((field, i) => {
          const parts: string[] = field.split('.');
          parts.pop();
          parts.reduce((res, part, idx) => {
            res += `.${part}`;
            builder.leftJoin(res, res);
            return res;
          }, 'entity');
          if (i) {
            sqb.orWhere(`entity.${field} = :${field}`, extraWhere);
          } else {
            sqb.where(`entity.${field} = :${field}`, extraWhere);
          }
        });
        return sqb;
      }));
    }
    if (extraWhere && extraWhere.isPublished) {
      delete query.isPublished;
      builder.andWhere('entity.isPublished = :isPublished', extraWhere);
    }
    if (query.orderBy && query.order) {
      builder.addOrderBy(`entity.${query.orderBy}`, query.order.toUpperCase() as any);
    }
    query.limit = query.limit || 200;
    query.page = query.page || 0;
    builder.take(query.limit || 200);
    builder.skip(query.page * query.limit || 0);
    delete query.limit;
    delete query.page;
    delete query.orderBy;
    delete query.order;
    const queryKeys = Object.keys(query);
    queryKeys.forEach(key => {
      builder.andWhere(`entity.${key} = :${key}`, query);
    });
    return builder;
  }

}
