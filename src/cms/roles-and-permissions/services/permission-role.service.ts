import { Injectable } from '@nestjs/common';
import { PermissionRoleEntity } from '../entities/permission-role.entity';
import { FindOneOptions, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from '../entities/role.entity';
import { PermissionEntity } from '../entities/permission.entity';

@Injectable()
export class PermissionRoleService {

  constructor(
    @InjectRepository(PermissionRoleEntity) private readonly permissionsRoleRepository: Repository<PermissionRoleEntity>,
  ) {}

  getAll() {
    return this.permissionsRoleRepository
      .find({
        relations: ['permission', 'role'],
      });
  }

  getSingle(id) {
    return this.permissionsRoleRepository
      .findOne({
        where: { id },
        relations: ['permission', 'role'],
      });
  }

  find(options) {
    return this.permissionsRoleRepository.find(options);
  }

  findOne(options: FindOneOptions<PermissionRoleEntity>) {
    return this.permissionsRoleRepository.findOne(options);
  }

  getPermissionsRoleByKeysAndRolesIds(keys: string[], rolesIds: number[]) {
    return this.permissionsRoleRepository
      .createQueryBuilder('pr')
      .where('role.id IN (:...rolesIds)', { rolesIds })
      .andWhere('permission.key IN (:...keys)', { keys })
      .leftJoinAndSelect('pr.role', 'role')
      .leftJoinAndSelect('pr.permission', 'permission')
      .getMany();
  }

  async insertPRAndForceUpdateIfDefault(pr: PermissionRoleEntity) {
    const existedPr = await this.permissionsRoleRepository.findOne({
      where: {
        roleId: pr.role ? pr.role.id : pr.roleId,
        permissionId: pr.permission ? pr.permission.id : pr.permissionId,
      },
    });
    if (existedPr) {
      if (pr.isDefault) {
        pr.id = existedPr.id;
      } else {
        return existedPr;
      }
    }
    try {
      pr = await this.permissionsRoleRepository.save(pr);
    } catch (e) {
      // TODO handle error correctly
      console.error(e);
    }
    return pr;
  }

  async insertPermissionRoleAssoc(permission, role, isEnabled: boolean | PermissionRoleEntity = false) {
    let pr: PermissionRoleEntity;
    if (typeof isEnabled === 'boolean') {
      pr = new PermissionRoleEntity({ isEnabled });
    } else {
      pr = isEnabled;
    }
    pr.permission = permission;
    pr.role = role;
    try {
      await this.permissionsRoleRepository.save(pr);
    } catch (e) {
      // already exists
    }
  }

  async updatePermissionRoleAssoc(pr: PermissionRoleEntity) {
    if (!pr.id) {
      const prDb = await this.permissionsRoleRepository.findOne({
        where: {
          roleId: pr.role ? pr.role.id : pr.roleId,
          permissionId: pr.permission ? pr.permission.id : pr.permissionId,
        },
      });
      prDb.isDefault = [ false, true ].indexOf(pr.isDefault) > -1 ?
        pr.isDefault : prDb.isDefault;
      prDb.isEnabled = [ false, true ].indexOf(pr.isEnabled) > -1 ?
        pr.isEnabled : prDb.isEnabled;
      pr = prDb;
    }
    return await this.permissionsRoleRepository.save(pr);
  }

  setPermissionRoleAssoc(pr: PermissionRoleEntity) {
    return this.permissionsRoleRepository.save(pr);
  }

  async countEnabledPermissionRoles(
    permission: PermissionEntity,
    roles: RoleEntity[],
  ) {
    const count = await this.permissionsRoleRepository
      .createQueryBuilder('permissionRole')
      .where('permissionRole.isEnabled = 1')
      .andWhere('permissionRole.permissionId = :permissionId')// OR photo.name = :bearName)")
      .andWhere('permissionRole.roleId IN (:roles)')
      // .setParameters({ permission, roles: roles.map(role => role.id) })
      .setParameters({ permissionId: permission.id, roles: roles.map(role => role.id) })
      .getCount();
    return count;
  }
}
