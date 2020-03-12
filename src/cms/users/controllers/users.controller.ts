import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get, InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put, Query,
  Req, UnauthorizedException, UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UserEntity } from '../entities/user.entity';
import { PermissionsGuard } from '../../roles-and-permissions/guards/permissions.guard';
import { UsersPermissionsKeys } from '../services/users-config.service';
import { DefineIfUserIsCurrentGuard } from '../guards/define-if-user-is-current.guard';
import { UserValidationPipe } from '../pipes/user-validation.pipe';
import { User } from '../decorators/user.decorator';
import { SendGridService } from '@anchan828/nest-sendgrid';
import { RolesAndPermissionsRolesName } from '../../roles-and-permissions/services/roles-and-permissions-config.service';
import { SanitizeUser, SanitizeUsers } from '../decorators/sanitize-user.decorator';

@Controller('users')
export class UsersController {

  constructor(
    private usersService: UsersService,
    private readonly sendGrid: SendGridService,
  ) {}

  @Get('')
  @UseGuards(PermissionsGuard(() => UsersPermissionsKeys.ViewAnyUser))
  async findAll(@Req() req, @Query() query: any) {
    return this.usersService.getAll(query);
  }

  @Get('count')
  @UseGuards(PermissionsGuard(() => UsersPermissionsKeys.ViewAnyUser))
  async countAll(@Req() req, @Query() query: any) {
    return this.usersService.countAll(query);
  }

  @Get('me')
  @SanitizeUser()
  async getMyInfo(@User() user: UserEntity) {
    return user;
  }

  @Post('')
  @UseGuards(PermissionsGuard(() => UsersPermissionsKeys.AddUser))
  async registerUser(@Body(new UserValidationPipe()) user: UserEntity) {
    // TODO check roles permission or remove roles array completely
    try {
      return await this.usersService.createUser(user);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException('Username already exists');
      } else {
        // TODO add logger
        throw new InternalServerErrorException();
      }
    }
  }

  @Get(':id')
  @UseGuards(PermissionsGuard(
    isOwner => isOwner ?
      UsersPermissionsKeys.ViewSelfUser : UsersPermissionsKeys.ViewAnyUser,
  ))
  @UseGuards(DefineIfUserIsCurrentGuard)
  async loadUser(@Param('id') id: number) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard(
    isOwner => isOwner ?
      UsersPermissionsKeys.RemoveSelfUser : UsersPermissionsKeys.RemoveAnyUser,
  ))
  @UseGuards(DefineIfUserIsCurrentGuard)
  async removeUser(@Param('id') id: number) {
    try {
      return await this.usersService.removeUser(id);
    } catch (e) {
      throw new BadRequestException(e.toString());
    }
  }

  @Put(':id')
  @UseGuards(PermissionsGuard(
    isOwner => isOwner ?
      UsersPermissionsKeys.EditSelfUser : UsersPermissionsKeys.EditAnyUser,
  ))
  @UseGuards(DefineIfUserIsCurrentGuard)
  async updateUser(
    @Param('id') id: number,
    @Body(new UserValidationPipe()) user: UserEntity,
  ) {
    // TODO check roles permission or remove roles array completely
    try {
      return await this.usersService.updateUser(user);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        // TODO i18n
        throw new UnprocessableEntityException('Username is already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  @Post('delegate')
  @UseGuards(PermissionsGuard(() => UsersPermissionsKeys.CreateDelegatedUsers))
  async registerDelegatedUser(@Body(new UserValidationPipe()) user: UserEntity, @User() author: UserEntity) {
    try {
      return await this.usersService.createDelegatedUser(user, author);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException('Username already exists');
      } else {
        // TODO add logger
        throw new InternalServerErrorException();
      }
    }
  }

  @Post('login')
  async loginUser(@Body() { username, password }) {
    if (username && password) {
      return await this.usersService.loginUser(username, password);
    } else {
      throw new BadRequestException();
    }
  }

  @Post('one-time-token')
  async test(@User() user: UserEntity) {
    if (user.id) {
      return await this.usersService.generateOneTimeToken(user);
    } else {
      throw new BadRequestException();
    }
  }

  @Post('logout')
  async logout(@User() user: UserEntity) {
    if (user.authToken) {
      return await this.usersService.removeToken(user.authToken);
    } else {
      throw new UnauthorizedException();
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() { email }) {
    if (email) {
      const newPass = await this.usersService.resetPassword(email);
      this.sendGrid.send({
        to: email,
        from: {
          email: 'support@snapgrabdelivery.com',
          name: 'SnapGrab',
        },
        subject: 'SnapGrab - New Password',
        templateId: 'd-242724fa0d154e848b45fe550a364971',
        dynamicTemplateData: {
          NEWPASS: newPass,
        },
      });
    } else {
      throw new BadRequestException();
    }
  }

  @Post('change-password/:id')
  @UseGuards(PermissionsGuard(
    isOwner => isOwner ?
      UsersPermissionsKeys.EditSelfUser : UsersPermissionsKeys.EditAnyUser,
  ))
  @UseGuards(DefineIfUserIsCurrentGuard)
  @SanitizeUser()
  async changePassword(
    @Body() { currentPassword, newPassword },
    @User() user: UserEntity,
    @Param('id') id: number,
  ) {
    if (user.roles.find(role => role.name === RolesAndPermissionsRolesName.Admin)) {
      if (!!newPassword) {
        return await this.usersService.changePasswordForce(id, newPassword);
      } else {
        throw new BadRequestException();
      }
    } else {
      if (currentPassword && newPassword) {
        return await this.usersService.changePassword(user, currentPassword, newPassword);
      } else {
        throw new BadRequestException();
      }
    }
  }

  @Post('change-password-without-current-password/:id')
  @UseGuards(PermissionsGuard(
    isOwner => isOwner ?
      UsersPermissionsKeys.EditSelfUser : UsersPermissionsKeys.EditAnyUser,
  ))
  @UseGuards(DefineIfUserIsCurrentGuard)
  @SanitizeUser()
  async changePasswordWithoutCurrentPassword(
    @Body() { newPassword }: { newPassword: string },
    @User() user: UserEntity,
  ) {
    if (newPassword && newPassword.length) {
      return await this.usersService.changePasswordForce(user.id, newPassword);
    } else {
      throw new BadRequestException();
    }
  }

  @Get('check-username/:username')
  async checkUsername(
    @Param('username') username: string,
    @Query('isActive') isActive: boolean,
  ) {
    const user = await this.usersService
      .checkUsernameExists(username, isActive);
    return {
      exists: !!user,
    };
  }

}
