import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RolesAndPermissionsPermissionsKeys } from '../services/roles-and-permissions-config.service';
import { PermissionRoleService } from '../services/permission-role.service';
import { PermissionRoleEntity } from '../entities/permission-role.entity';
import { RolesAndPermissionsService } from '../services/roles-and-permissions.service';
import { ValidatePermissionRolesPipe } from '../pipes/validate-permission-roles.pipe';
import { User } from '../../users/decorators/user.decorator';
import { UserEntity } from '../../users/entities/user.entity';

@Controller('roles-and-permissions')
export class RolesAndPermissionsController {

  constructor(
    private prService: PermissionRoleService,
    private rolesAndPermissionsService: RolesAndPermissionsService,
  ) {}

  @Get('')
  @UseGuards(PermissionsGuard(() => RolesAndPermissionsPermissionsKeys.ManagePermissions))
  async loadRoleAndPermissions() {
    const perms = await this.rolesAndPermissionsService.getPermissionWithRoleAssoc();
    const systemRoles = await this.rolesAndPermissionsService.getRolesByCondition({ isSystem: true });
    const systemRolesIds = systemRoles.map(role => role.id);
    return perms.map(perm => {
      perm.permissionRoles = perm.permissionRoles.filter(pr => systemRolesIds.indexOf(pr.roleId) === -1);
      return perm;
    });
    return this.rolesAndPermissionsService.getPermissionWithRoleAssoc();
  }

  @Post('')
  @UseGuards(PermissionsGuard(() => RolesAndPermissionsPermissionsKeys.ManagePermissions))
  async setRoleAndPermissions(@Body(ValidatePermissionRolesPipe) prs: PermissionRoleEntity[]) {
    for (const i in prs) {
      const pr = prs[i];
      const isDef = await this.checkIfIsDefault(pr.id);
      if (!isDef) {
        await this.prService.setPermissionRoleAssoc(pr);
      }
    }
    return this.loadRoleAndPermissions();
  }

  @Get('check/:keys')
  async check(@User() user: UserEntity, @Param('keys') keys: string) {
    const keysArray = keys.split(',');
    const test = await this.rolesAndPermissionsService
      .getPermissionsByKeysAndRoles(keysArray, user.roles);
    return test;
  }

  async checkIfIsDefault(id) {
    const pr = await this.prService.findOne({
      where: {
        id,
        isDefault: true,
      },
    });
    return !!pr;
  }


}
