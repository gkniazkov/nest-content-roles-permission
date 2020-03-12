import { Injectable } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { RolesService } from './roles.service';
import { PermissionRoleService } from './permission-role.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PermissionEntity } from '../entities/permission.entity';
import { ContentPermissionHelper } from '../misc/content-permission-helper';
import { RoleEntity } from '../entities/role.entity';
import { RolesAndPermissionsConfigService, RolesAndPermissionsRolesName } from './roles-and-permissions-config.service';
import { PermissionRoleEntity } from '../entities/permission-role.entity';
import { RolesAndPermissionsConfig } from '../data/roles-and-permissions-config.interface';

@Injectable()
export class RolesAndPermissionsService {

  private $inited = new BehaviorSubject<boolean>(false);
  public $initComplete = this.$inited.asObservable();
  private $isBusy = new BehaviorSubject(false);
  private queue: RolesAndPermissionsConfig[] = [];

  constructor(
    public config: RolesAndPermissionsConfigService,
    private roles: RolesService,
    private permissions: PermissionsService,
    private permissionRole: PermissionRoleService,
    private contentPermissionHelper: ContentPermissionHelper,
  ) {
  }

  public async init() {
    this.$isBusy
      .subscribe(isBusy => {
        if (isBusy) {
          this.$inited.next(true);
        } else if (this.$inited.getValue() && this.queue.length) {
          const config = this.queue.shift();
          this.registerConfig(config);
        }
      });
    await this.registerConfig(this.config);
  }

  setPermissionRoleAssoc(pr: PermissionRoleEntity) {
    return this.permissionRole.setPermissionRoleAssoc(pr);
  }

  updatePermissionRoleAssoc(pr: PermissionRoleEntity) {
    return this.permissionRole.updatePermissionRoleAssoc(pr);
  }

  public registerModuleConfig(config: RolesAndPermissionsConfig) {
    if (!this.$inited.getValue() || this.$isBusy.getValue()) {
      this.queue.push(config);
    } else {
      this.registerConfig(config);
    }
  }

  public registerPermissions(permissions: PermissionEntity[], createRoleAssoc = true, skipInited = false) {
    const $registered = new Subject<PermissionEntity[]>();
    this.$inited
      .pipe(
        takeUntil($registered),
      )
      .subscribe(async inited => {
        if (skipInited || inited) {
          permissions = await this.savePermissions(permissions, createRoleAssoc);
          $registered.next(permissions);
          $registered.complete();
        }
      });
    return $registered.asObservable();
  }

  public async registerEntityPermissions(entity: Function, group: string = null, createRoleAssoc = true) {
    const permissions = this.contentPermissionHelper.getContentPermissions(entity, group);
    return await this.registerPermissions(permissions, createRoleAssoc).toPromise();
  }

  public getPermissionByKey(key: string) {
    return this.permissions.getPermission({key});
  }

  public async getPermissionsByKeysAndRoles(keys: string[], roles: RoleEntity[]) {
    const prs = await this.permissionRole.getPermissionsRoleByKeysAndRolesIds(
      keys,
      roles.map(role => role.id),
    );
    return prs.reduce((res, pr) => {
      res[pr.permission.key] = res[pr.permission.key] || pr.isEnabled;
      return res;
    }, {});
  }

  public registerRoles(roles: RoleEntity[], createRoleAssoc = true, skipInited = false) {
    const $registered = new Subject<RoleEntity[]>();
    this.$inited
      .pipe(
        takeUntil($registered),
      )
      .subscribe(async inited => {
        if (skipInited || inited) {
          roles = await this.saveRoles(roles, createRoleAssoc);
          $registered.next(roles);
          $registered.complete();
        }
      });
    return $registered.asObservable();
  }

  public getRoles() {
    return this.roles.getAll();
  }

  public getRolesByCondition(condition) {
    return this.roles.getRoles(condition, false);
  }

  public findRoleByName(name: string) {
    return this.roles.getRole({name});
  }

  public async checkPermissionByRoles(permission: PermissionEntity, roles: RoleEntity[]) {
    const enabledCount = await this.permissionRole.countEnabledPermissionRoles(permission, roles);
    return !!enabledCount;
  }

  public getPermissionWithRoleAssoc() {
    return this.permissions.getRolesAssoc();
  }

  public setPermissionsRolesDefaultValues(
    perms: PermissionEntity[] | PermissionEntity,
    roles: RoleEntity[] | RoleEntity,
    values: PermissionRoleEntity[] | PermissionRoleEntity,
    ) {
    perms = Array.isArray(perms) ? perms : [perms];
    roles = Array.isArray(roles) ? roles : [roles];
    values = Array.isArray(values) ? values : [values];

    (perms as PermissionEntity[]).forEach(perm => {
      (roles as RoleEntity[]).forEach(role => {
        (values as PermissionRoleEntity[]).forEach(value => {
          value.role = role;
          value.permission = perm;
          this.permissionRole.updatePermissionRoleAssoc(
            // perm,
            // role,
            value,
          );
        });
      });
    });
  }

  private async savePermissions(permissions: PermissionEntity[], createRoleAssoc = true) {
    const newPermissions: PermissionEntity[] = [];
    for (const i in permissions) {
      let permission = permissions[i];
      permission = await this.savePermission(permission, createRoleAssoc);
      newPermissions.push(permission);
    }
    return newPermissions;
  }

  private async savePermission(permission: PermissionEntity, createRoleAssoc = true) {
    const res = await this.permissions.registerPermission(permission);
    if (res.isNew && createRoleAssoc) {
      const roles = await this.roles.getAll();
      for (const i in roles) {
        const role = roles[i];
        await this.permissionRole
          .insertPermissionRoleAssoc(
            res.permission,
            role,
            new PermissionRoleEntity({
              isDefault: role.name === RolesAndPermissionsRolesName.Admin,
              isEnabled: role.name === RolesAndPermissionsRolesName.Admin,
            }),
          );
      }
    }
    return res.permission;
  }

  private async saveRoles(roles: RoleEntity[], createRoleAssoc = true) {
    const newRoles: RoleEntity[] = [];
    for (const i in roles) {
      let role = roles[i];
      role = await this.saveRole(role, createRoleAssoc);
      newRoles.push(role);
    }
    return newRoles;
  }

  private async saveRole(role: RoleEntity, createRoleAssoc = true) {
    const res = await this.roles.registerRole(role);
    if (res.isNew && createRoleAssoc) {
      const permissions = await this.permissions.getAll();
      for (const i in permissions) {
        const permission = permissions[i];
        await this.permissionRole
          .insertPermissionRoleAssoc(
            permission,
            res.role,
            new PermissionRoleEntity({
              isDefault: role.name === RolesAndPermissionsRolesName.Admin,
              isEnabled: role.name === RolesAndPermissionsRolesName.Admin,
            }),
          );
      }
    }
    return res.role;
  }

  private async registerConfig(config: RolesAndPermissionsConfig) {
    this.$isBusy.next(true);

    let permissions = [];
    if (config.MODULE_PERMISSIONS) {
      permissions = await this.registerPermissions(
          config.MODULE_PERMISSIONS,
          false,
        config === this.config,
        ).toPromise();
    }

    let roles = [];
    if (config.MODULE_ROLES) {
      roles = await this.registerRoles(
          config.MODULE_ROLES,
          false,
        ).toPromise();
    }

    let contentsPermissions = [];
    if (config.MODULE_CONTENTS) {
      for (const entityFnIdx in config.MODULE_CONTENTS) {
        const contentPermissions =
          await this.registerEntityPermissions(
            config.MODULE_CONTENTS[entityFnIdx],
            config.MODULE_GROUP,
            false,
          );
        contentsPermissions = contentsPermissions.concat(contentPermissions);
      }
    }

    permissions = permissions.concat(contentsPermissions);

    if (permissions.length) {
      const allRoles = await this.getRoles();
      for (const pIdx in permissions) {
        const permission = permissions[pIdx];
        for (const rIdx in allRoles) {
          const role = allRoles[rIdx];
          const pr = await this.getPR(role, permission, config);
          try {
            await this.permissionRole.insertPRAndForceUpdateIfDefault(pr);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
    if (roles.length) {
      const allPermissions = await this.permissions.getAll();
      for (const rIdx in roles) {
        const role = roles[rIdx];
        for (const pIdx in allPermissions) {
          const permission = allPermissions[pIdx];
          const pr = await this.getPR(role, permission, config);
          try {
            await this.permissionRole.insertPRAndForceUpdateIfDefault(pr);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    this.$isBusy.next(false);
  }

  private async getPR(
    role: RoleEntity,
    permission: PermissionEntity,
    config: RolesAndPermissionsConfig,
  ) {
    const isAdmin = role.name === RolesAndPermissionsRolesName.Admin;
    const permissionRoleKey = this.contentPermissionHelper
      .getPermissionRoleKey(
        permission.key,
        role.name,
      );
    const pr = new PermissionRoleEntity({
      isEnabled: isAdmin || (
        typeof config.MODULE_DEFAULT_PERMISSION_ROLES !== 'undefined'
        &&
        config.MODULE_DEFAULT_PERMISSION_ROLES[permissionRoleKey]
      ),
      isDefault: isAdmin || (
        typeof config.MODULE_DEFAULT_PERMISSION_ROLES !== 'undefined'
        &&
        typeof config.MODULE_DEFAULT_PERMISSION_ROLES[permissionRoleKey] !== 'undefined'
      ),
      roleId: role.id,
      permissionId: permission.id,
    });
    return pr;
  }
}
