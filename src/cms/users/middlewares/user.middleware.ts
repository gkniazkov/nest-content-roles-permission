import { Injectable, NestMiddleware } from '@nestjs/common';
import { UsersService } from '../services/users.service';

@Injectable()
export class UserMiddleware implements NestMiddleware {

  constructor(
    private usersService: UsersService,
  ) {}

  async use(req: any, res: any, next: () => void) {
    const sign = req.headers.authorization || '';
    const payload = this.usersService.decodeAuthToken(sign.replace('Bearer ', ''));
    const user = await this.usersService.getUserAuth(payload);
    req.user = user;
    if (user.id) {
      await this.usersService
        .updateLastAccess(user);
    }
    next();
  }
}
