import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform, UnprocessableEntityException } from '@nestjs/common';
import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class ValidateRolePipe implements PipeTransform {
  transform(role: RoleEntity, metadata: ArgumentMetadata) {
    if (!role.name || role.name.length > 64) {
      throw new UnprocessableEntityException('Max role name length is 64 symbols');
    }
    if (!role.group || role.group.length > 64) {
      throw new UnprocessableEntityException('Max role group name length is 64 symbols');
    }
    return new RoleEntity(role);
  }
}
