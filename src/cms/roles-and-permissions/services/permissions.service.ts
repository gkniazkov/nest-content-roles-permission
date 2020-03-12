import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PermissionEntity } from '../entities/permission.entity';
import { Subject } from 'rxjs';

@Injectable()
export class PermissionsService {

  private $$permissionRegistered = new Subject();
  public $permissionRegistered = this.$$permissionRegistered.asObservable();

  constructor(
    @InjectRepository(PermissionEntity) private readonly permissionsRepository: Repository<PermissionEntity>,
  ) {}

  getAll() {
    return this.permissionsRepository.find();
  }

  getRolesAssoc() {
    return this.permissionsRepository
      .find({
        // relations: ['permissionRoles', 'permissionRoles.role'],
        relations: ['permissionRoles'],
        order: {
          group: 'ASC',
          description: 'ASC',
        },
      });
  }

  async registerPermission(permission: PermissionEntity) {
    let isNew = true;
    try {
      permission = await this.permissionsRepository.save(permission);
    } catch {
      isNew = false;
      permission = await this.permissionsRepository.findOne({key: permission.key});
    }
    if (isNew) {
      this.$$permissionRegistered.next(permission);
    }
    return { isNew, permission };
  }

  getPermission(conditions?) {
    return this.permissionsRepository.findOne(conditions);
  }

}
