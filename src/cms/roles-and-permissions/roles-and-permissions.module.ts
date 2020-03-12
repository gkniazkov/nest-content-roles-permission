import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from './services/permissions.service';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { PermissionRoleEntity } from './entities/permission-role.entity';
import { RolesService } from './services/roles.service';
import { ContentPermissionHelper } from './misc/content-permission-helper';
import { RolesController } from './controllers/roles.controller';
import { RolesAndPermissionsService } from './services/roles-and-permissions.service';
import { RolesAndPermissionsController } from './controllers/roles-and-permissions.controller';
import { I18nModule } from '../i18n/i18n.module';
import { PermissionRoleService } from './services/permission-role.service';
import { RolesAndPermissionsConfigService } from './services/roles-and-permissions-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoleEntity, PermissionEntity, PermissionRoleEntity]),
    I18nModule,
  ],
  providers: [
    RolesService,
    PermissionsService,
    ContentPermissionHelper,
    RolesAndPermissionsService,
    PermissionRoleService,
    RolesAndPermissionsConfigService,
  ],
  exports: [
    RolesAndPermissionsService,
    ContentPermissionHelper,
  ],
  controllers: [RolesController, RolesAndPermissionsController],
})
export class RolesAndPermissionsModule {
  constructor(
    private rolesAndPermissions: RolesAndPermissionsService,
  ) {
    // this.rolesAndPermissions.init();
  }

  configure(consumer: MiddlewareConsumer) {
    this.rolesAndPermissions.init();
  }
}
