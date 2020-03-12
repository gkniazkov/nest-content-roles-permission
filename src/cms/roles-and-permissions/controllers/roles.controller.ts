import {
  Body,
  Controller, Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post, Put, Query,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { PermissionsGuard } from '../guards/permissions.guard';
import { ForbidDefaultRoleActionGuard } from '../guards/forbid-default-role-action.guard';
import { RolesAndPermissionsPermissionsKeys } from '../services/roles-and-permissions-config.service';
import { RoleEntity } from '../entities/role.entity';
import { RolesService } from '../services/roles.service';
import { ValidateRolePipe } from '../pipes/validate-role.pipe';
import { RolesAndPermissionsService } from '../services/roles-and-permissions.service';

@Controller('roles')
export class RolesController {

  constructor(
    private rolesService: RolesService,
    private rolesAndPermissionsService: RolesAndPermissionsService,
  ) {}

  @Get('')
  @UseGuards(PermissionsGuard(() => RolesAndPermissionsPermissionsKeys.ViewRole))
  loadRoles(@Query('name') name: string): Promise<RoleEntity[]> {
    if (name) {
      return this.rolesService.getRoles({ name });
    } else {
      return this.rolesService.getAll(false);
    }
  }

  @Post('')
  @UseGuards(PermissionsGuard(() => RolesAndPermissionsPermissionsKeys.AddRole))
  async createRole(@Body(new ValidateRolePipe()) role: RoleEntity): Promise<RoleEntity> {
    role.isDefault = false;
    try {
      const roles = await this.rolesAndPermissionsService
        .registerRoles([role])
        .toPromise();
      return roles[0];
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException('Role already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  @Get(':id')
  @UseGuards(PermissionsGuard(() => RolesAndPermissionsPermissionsKeys.ViewRole))
  async loadRole(@Param('id') id: number): Promise<RoleEntity> {
    const role = await this.rolesService.getRole({id});
    if (!role) {
      throw new NotFoundException();
    }
    return role;
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard(() => RolesAndPermissionsPermissionsKeys.RemoveRole))
  @UseGuards(ForbidDefaultRoleActionGuard)
  async removeRole(@Param('id') id: string): Promise<RoleEntity> {
    return await this.rolesService.removeRole(id);
  }

  @Put(':id')
  @UseGuards(PermissionsGuard(() => RolesAndPermissionsPermissionsKeys.EditRole))
  @UseGuards(ForbidDefaultRoleActionGuard)
  async updateRole(
    @Param('id') id: string,
    @Body(new ValidateRolePipe()) role: RoleEntity,
  ): Promise<RoleEntity> {
    role.id = parseInt(id, 10);
    role.isDefault = false;
    try {
      return await this.rolesService.updateRole(new RoleEntity(role));
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException('Role already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
