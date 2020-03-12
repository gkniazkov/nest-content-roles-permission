import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../services/users.service';

@Injectable()
export class DefineIfUserIsCurrentGuard implements CanActivate {

  constructor(
    private usersService: UsersService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ) {
    const request = context.switchToHttp().getRequest();
    const requestedUser = await this.usersService.findById(request.params.id);

    if (!requestedUser) {
      throw new NotFoundException();
    } else {
      request.isOwner = parseInt(request.user.id, 10) === parseInt(request.params.id, 10);
      return true;
    }
  }
}
