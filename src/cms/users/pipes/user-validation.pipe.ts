import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserValidationPipe implements PipeTransform {
  transform(user: UserEntity, metadata: ArgumentMetadata) {
    // if (user.username && (user.id || user.password)) {
    if (user.username) {
      return new UserEntity(user);
    } else {
      throw new BadRequestException();
    }
  }
}
