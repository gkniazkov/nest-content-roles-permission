import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { Connection, Repository } from 'typeorm';

@Injectable()
export class ContentEntityNotFoundGuard implements CanActivate {

  constructor(
    private connection: Connection,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ) {
    const request = context.switchToHttp().getRequest();
    const entityFn = (context.getClass() as any).entityFn;
    const entityRepo = this.connection.getRepository(entityFn);
    const entity = await entityRepo.findOne({id: request.params.id});
    if (!entity) {
      throw new NotFoundException();
    }
    request.contentEntity = entity;
    return true;
  }
}
