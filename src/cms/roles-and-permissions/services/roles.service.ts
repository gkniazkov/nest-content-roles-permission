import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Subject } from 'rxjs';

@Injectable()
export class RolesService {

  private $$roleRegistered = new Subject();
  public $roleRegistered = this.$$roleRegistered.asObservable();

  constructor(
    @InjectRepository(RoleEntity) private readonly rolesRepository: Repository<RoleEntity>,
  ) {}

  getAll(excludeSystem = true) {
    const conditions: any = {};
    if (excludeSystem) {
      conditions.isSystem = false;
    }
    return this.rolesRepository.find(conditions);
  }

  getRole(conditions?) {
    return this.rolesRepository.findOne(conditions);
  }

  getRoles(conditions?, excludeSystem = true) {
    conditions = conditions || {};
    if (excludeSystem) {
      conditions.isSystem = false;
    }
    return this.rolesRepository.find(conditions);
  }

  async updateRole(role: RoleEntity) {
    return this.rolesRepository.save(role);
  }

  async registerRole(role: RoleEntity) {

    const existedRole = await this.rolesRepository
      .findOne({
        name: role.name,
      });

    const isNew = !!existedRole;

    if (existedRole) {
      role = existedRole;
    } else {
      role = await this.rolesRepository.save(role);
    }

    if (isNew) {
      this.$$roleRegistered.next(role);
    }
    return { isNew, role };

    // let isNew = true;
    // try {
    //   role = await this.rolesRepository.save(role);
    // } catch {
    //   isNew = false;
    //   role = await this.rolesRepository.findOne({name: role.name});
    // }
    // if (isNew) {
    //   this.$$roleRegistered.next(role);
    // }
    // return { isNew, role };
  }

  async removeRole(roleId) {
    const role = await this.getRole({id: roleId});
    return await this.rolesRepository.remove(role);
  }
}
