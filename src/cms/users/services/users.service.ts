import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RolesAndPermissionsService } from '../../roles-and-permissions/services/roles-and-permissions.service';
import { UsersConfigService } from './users-config.service';
import { RolesAndPermissionsRolesName } from '../../roles-and-permissions/services/roles-and-permissions-config.service';
import { SanitizeUser, SanitizeUsers } from '../decorators/sanitize-user.decorator';
import { UserTokenEntity } from '../entities/user-token.entity';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { RoleEntity } from '../../roles-and-permissions/entities/role.entity';
import { PermissionEntity } from '../../roles-and-permissions/entities/permission.entity';
import { PermissionRoleEntity } from '../../roles-and-permissions/entities/permission-role.entity';
import { interval, timer } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { UserOneTimeTokenEntity } from '../entities/user-one-time-token.entity';
import { UserLastAccessEntity } from '../entities/user-last-access.entity';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(UserEntity) private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(UserTokenEntity) private readonly tokensRepository: Repository<UserTokenEntity>,
    @InjectRepository(UserOneTimeTokenEntity) private readonly oneTimeTokenEntityRepository: Repository<UserOneTimeTokenEntity>,
    @InjectRepository(UserLastAccessEntity) private readonly lastAccessEntityRepository: Repository<UserLastAccessEntity>,
    private usersConfigService: UsersConfigService,
    private rolesAndPermissions: RolesAndPermissionsService,
    private jwtService: JwtService,
  ) {}

  async init() {
    await this.rolesAndPermissions.registerModuleConfig(this.usersConfigService);
    this.rolesAndPermissions
      .$initComplete
      .subscribe(async (complete) => {
        // TODO this functionality works wrong. Event trigger several times (for each config). See $initComplete implementation
        if (complete) {
          const adminRole = await this.rolesAndPermissions.findRoleByName(RolesAndPermissionsRolesName.Admin);
          const adminUser = new UserEntity({
            username: 'admin',
            password: 'admin',
            isDefault: true,
            roles: [ adminRole ],
          });
          try {
            await this.createUser(adminUser, true);
          } catch (e) {
            // user exists
          }
        }
      });
  }

  @SanitizeUser(null, false)
  async createUser(user: UserEntity, isDefault = false, skipHashPassword = false): Promise<UserEntity> {
    await this.addUserRoleIfAbsent(user);
    if (!skipHashPassword) {
      user = await this.getCleanUser(user);
      user.isDefault = isDefault;
    }
    user.skipHashPassword = skipHashPassword;
    // TODO validate
    return await this.usersRepository.save(user);
  }

  @SanitizeUser()
  async createDelegatedUser(user: UserEntity, delegator: UserEntity, isDefault = false): Promise<UserEntity> {
    await this.addUserRoleIfAbsent(user);
    let cleanUser = await this.getCleanUser(user);
    cleanUser.isDefault = isDefault;
    const role = await this.mergePermissions(user.roles, delegator.roles);
    cleanUser.roles = [ role ];
    await this.addUserRoleIfAbsent(cleanUser);
    cleanUser = await this.getCleanUser(cleanUser);
    cleanUser.delegator = delegator;
    return await this.usersRepository.save(cleanUser);
  }

  @SanitizeUser()
  async updateUser(user: UserEntity) {
    await this.addUserRoleIfAbsent(user);
    const cleanUser = await this.getCleanUser(user);
    // TODO validate
    return await this.usersRepository.save(cleanUser);
  }

  @SanitizeUser()
  async updateDelegatedUser(user: UserEntity, delegator: UserEntity): Promise<UserEntity> {
    await this.addUserRoleIfAbsent(user);
    let cleanUser = await this.getCleanUser(user);
    const role = await this.mergePermissions(user.roles, delegator.roles);
    cleanUser.roles = [ role ];
    await this.addUserRoleIfAbsent(cleanUser);
    cleanUser = await this.getCleanUser(cleanUser);
    cleanUser.delegator = delegator;
    return await this.usersRepository.save(cleanUser);
  }

  @SanitizeUser(null, false)
  async loginUser(username: string, password: string): Promise<UserEntity> {

    const throwDelayedError = (message) => {
      const delay = interval(3000);
      return delay
        .pipe(timeout(3100),
          map(() => {
            // TODO i18n
            throw new UnprocessableEntityException(message);
          }),
        )
        .toPromise();
    };
    // TODO USE ENVIRONMENT VARIABLE
    // let user = new UserEntity({ username });
    let user = await this.usersRepository.findOne({ username });
    if (!user) {
      return throwDelayedError('Username or password is invalid');
    }
    user.setPassword(password);
    user = await this.usersRepository.findOne(user, {
      relations: ['roles'],
    });
    if (user) {
      if (!user.isActive) {
        return throwDelayedError('User is inactive');
      }
      const hash = this.generateUniqueHash();
      let userToken = new UserTokenEntity({
        user,
        token: hash,
      });
      userToken = await this.tokensRepository.save(userToken);
      const payload = { userId: user.id, token: userToken.token };
      const sign =  this.jwtService.sign(payload);
      user.authToken = sign;
      return user;
    } else {
      return throwDelayedError('Username or password is invalid');
    }
  }

  async updateLastAccess(user: UserEntity) {
    let entity = await this.lastAccessEntityRepository
      .findOne({ userId: user.id });
    entity = entity || new UserLastAccessEntity({
      userId: user.id,
    });
    entity.lastAccessAt = new Date();
    return this.lastAccessEntityRepository.save(entity);
  }

  async generateOneTimeToken(user: UserEntity) {
    const hash = this.generateUniqueHash();
    let otToken = new UserOneTimeTokenEntity({
      user,
      token: hash,
    });
    otToken = await this.oneTimeTokenEntityRepository.save(otToken);
    const payload = { userId: user.id, token: otToken.token };
    const sign =  this.jwtService.sign(payload);
    return { sign };
  }

  decodeAuthToken(authToken) {
    const payload = this.jwtService.decode(authToken) as any;
    return payload;
  }

  async loginUserById(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne(id, {
      relations: ['roles'],
    });
    if (user) {
      const hash = this.generateUniqueHash();
      let userToken = new UserTokenEntity({
        user,
        token: hash,
      });
      userToken = await this.tokensRepository.save(userToken);
      const payload = { userId: user.id, token: userToken.token };
      const sign =  this.jwtService.sign(payload);
      user.authToken = sign;
      return user;
    } else {
      throw new NotFoundException('User not found');
    }
  }

  @SanitizeUser(null, false)
  async getUserAuth(where) {
    if (!where) {
      return await this.getAnonymousUser();
    }
    const userToken = await this.tokensRepository.findOne({
      where,
      relations: ['user' , 'user.roles'],
    });

    if (userToken && userToken.user.isActive) {
      userToken.user.authToken = userToken.token;
      return userToken.user;
    } else {
      return await this.getAnonymousUser();
    }
  }

  @SanitizeUser(null, false)
  async getUserOneTimeAuth(where) {
    if (!where) {
      return await this.getAnonymousUser();
    }
    const userToken = await this.oneTimeTokenEntityRepository.findOne({
      where,
      relations: ['user' , 'user.roles'],
    });
    if (userToken) {
      await this.oneTimeTokenEntityRepository.remove(userToken);
      if (userToken.user.isActive) {
        return userToken.user;
      }
    }
    return await this.getAnonymousUser();
  }

  @SanitizeUser()
  async findById(userId): Promise<UserEntity> {
    return await this.usersRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['roles'],
    });
  }

  @SanitizeUsers()
  getAll(query: any) {
    const params: any = {
      relations: ['roles'],
    };
    if (query.limit) {
      params.skip = query.page * query.limit;
      params.take = query.limit;
    } else {
      params.skip = 0;
      params.take = 50;
    }
    if (query.orderBy) {
      params.order = {
        [query.orderBy]: query.order,
      };
    }
    return this.usersRepository
      .find(params);
  }

  countAll(query: any) {
    const params: any = {
      relations: ['roles'],
    };
    if (query.limit) {
      params.skip = query.page * query.limit;
      params.take = query.limit;
    }
    if (query.orderBy) {
      params.order = {
        [query.orderBy]: query.order,
      };
    }
    return this.usersRepository
      .count(params);
  }

  async checkUsernameExists(username: string, isActive?) {
    const conditions: any = {
      username,
    };
    if (isActive === 'true' || isActive === 'false') {
      conditions.isActive = isActive === 'true';
    }
    const existedUser = await this.usersRepository
      .findOne(conditions);
    return !!existedUser;
  }

  async removeToken(token: string) {
    const tokenEntity = await this.tokensRepository.findOne({
      where: {token},
    });
    return await this.tokensRepository
      .remove(tokenEntity);
  }

  @SanitizeUser()
  async removeUser(userId) {
    const user = await this.findById(userId);
    if (user.isDefault) {
      throw new ForbiddenException('Impossible to delete default user');
    }
    return this.usersRepository.remove(user);
  }

  @SanitizeUser()
  async changePassword(user: UserEntity, currentPassword: string, newPassword: string) {
    let tempUser = new UserEntity({ id: user.id });
    tempUser.setPassword(currentPassword);
    tempUser = await this.usersRepository.findOne(tempUser);
    if (tempUser) {
      tempUser.password = newPassword;
      user = await this.usersRepository.save(tempUser);
      return user;
    } else {
      // TODO i18n
      throw new UnprocessableEntityException('Current password is invalid');
    }
  }

  @SanitizeUser()
  async changePasswordForce(userId: number, newPassword: string) {
    let tempUser = new UserEntity({ id: userId });
    tempUser = await this.usersRepository.findOne(tempUser);
    if (tempUser) {
      tempUser.password = newPassword;
      return await this.usersRepository.save(tempUser);
    } else {
      throw new UnprocessableEntityException('User does not exist');
    }
  }

  @SanitizeUser()
  getSingle(params) {
    return this.usersRepository.findOne(params);
  }

  async resetPassword(username: string): Promise<string> {
    const user = await this.usersRepository.findOne({ username });
    if (user) {
      const newPassword = this.generateUniqueHash().slice(0, 6);
      user.password = newPassword;
      await this.usersRepository.save(user);
      return newPassword;
    } else {
      throw new UnprocessableEntityException('User does\'nt exist');
    }
  }

  public async addRoleIfAbsent(user: UserEntity, roleName: string) {
    const mandatoryRole = await this.rolesAndPermissions.findRoleByName(roleName);

    if (user.roles) {
      if (!user.roles.find(role => role.id === mandatoryRole.id)) {
        user.roles.push(mandatoryRole);
      }
    } else {
      user.roles = [mandatoryRole];
    }
    return user;
  }

  private async mergePermissions(newRoles: RoleEntity[], delegatorRoles: RoleEntity[]) {
    const newRolesIds = newRoles.map(newRole => newRole.id);
    const delegatorRolesIds = delegatorRoles.map(delegatorRole => delegatorRole.id);
    const permissions = await this.rolesAndPermissions.getPermissionWithRoleAssoc();
    const enabledPermissions: PermissionEntity[] = [];
    const enabledPermissionsIds: number[] = [];
    const disabledPermissionsIds: number[] = [];
    permissions.forEach(perm => {
      const isEnabled = perm.permissionRoles.reduce(
        (res, pr) => {
          res[0] = res[0] || pr.isEnabled
            && newRolesIds.indexOf(pr.roleId) > -1;
          res[1] = res[1] || pr.isEnabled
            && delegatorRolesIds.indexOf(pr.roleId) > -1;
          return res;
        }, [false, false])
        .reduce((res, val) => res && val, true);
      if (isEnabled) {
        enabledPermissionsIds.push(perm.id);
        enabledPermissions.push(perm);
      } else {
        disabledPermissionsIds.push(perm.id);
      }
    });
    const md5Hash = crypto.createHash('md5').update(
      enabledPermissions
        .sort((p1, p2) => p1.id < p2.id ? 1 : -1)
        .map(p => p.key)
        .join('_'),
    ).digest('hex');
    const roleName = 'sys_' + md5Hash;
    let role = await this.rolesAndPermissions.findRoleByName(roleName);
    if (!role) {
      const roles = await this.rolesAndPermissions
        .registerRoles(
          [
            new RoleEntity({
              name: roleName,
              description: 'Generated By User module (delegated role)',
              group: this.usersConfigService.MODULE_GROUP,
              isSystem: true,
            }),
          ],
          false,
          true,
        )
        .toPromise();
      role = roles[0];
      enabledPermissionsIds.forEach(permissionId => {
        // this.rolesAndPermissions.updatePermissionRoleAssoc(new PermissionRoleEntity({
        this.rolesAndPermissions.setPermissionRoleAssoc(new PermissionRoleEntity({
          permissionId,
          roleId: role.id,
          isEnabled: true,
        }));
      });
      disabledPermissionsIds.forEach(permissionId => {
        this.rolesAndPermissions.setPermissionRoleAssoc(new PermissionRoleEntity({
          permissionId,
          roleId: role.id,
          isEnabled: false,
        }));
      });
    }

    return role;
  }

  private async addUserRoleIfAbsent(user: UserEntity) {
    if (!user.id || user.roles) {
      return await this.addRoleIfAbsent(user, RolesAndPermissionsRolesName.User);
    }
  }

  private generateUniqueHash() {
    return crypto.createHmac('sha256', crypto.randomBytes(256)).digest('hex');
  }

  private async getAnonymousUser() {
    const role = await this.rolesAndPermissions.findRoleByName(
      RolesAndPermissionsRolesName.Anonymous,
    );
    return new UserEntity({
      roles: [
        role,
      ],
    });
  }

  private async getCleanUser(user: UserEntity) {
    let cleanUser: UserEntity;
    if (user.id) {
      cleanUser = await this.findById(user.id);
    } else {
      cleanUser = new UserEntity();
    }
    cleanUser.username = user.username;
    cleanUser.roles = user.roles;
    if (user.password) {
      cleanUser.password = user.password;
    }
    if ([true, false].indexOf(user.isActive) > -1) {
      cleanUser.isActive = user.isActive;
    }
    return cleanUser;
  }

}
