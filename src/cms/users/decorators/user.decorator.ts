import { createParamDecorator } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';

export const User = createParamDecorator((data, req): UserEntity => {
  return req.user;
});
