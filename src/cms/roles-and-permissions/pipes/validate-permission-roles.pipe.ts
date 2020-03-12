import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { PermissionRoleEntity } from '../entities/permission-role.entity';
import { PermissionRoleService } from '../services/permission-role.service';
import { RolesAndPermissionsRolesName } from '../services/roles-and-permissions-config.service';

@Injectable()
export class ValidatePermissionRolesPipe implements PipeTransform {

  constructor(
    private prService: PermissionRoleService,
  ) {}

  async transform(prs: PermissionRoleEntity[], metadata: ArgumentMetadata) {
    const validPrs = [];
    for (const i in prs) {
      const pr = prs[i];
      const prWithRole = await this.prService.getSingle(pr.id);
      if (prWithRole && prWithRole.role.name !== RolesAndPermissionsRolesName.Admin) {
        validPrs.push(pr);
      }
    }
    return validPrs;
  }
}
