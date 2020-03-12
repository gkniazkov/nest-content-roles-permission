import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RolesService } from '../services/roles.service';

@Injectable()
export class ForbidDefaultRoleActionGuard implements CanActivate {

  constructor(
    private rolesService: RolesService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ) {
    const request = context.switchToHttp().getRequest();
    const role = await this.rolesService.getRole({ id: request.params.id });
    if (!role) {
      throw new NotFoundException();
    } else if (role.isDefault) {
      throw new ForbiddenException();
    } else {
      return true;
    }
  }
}
