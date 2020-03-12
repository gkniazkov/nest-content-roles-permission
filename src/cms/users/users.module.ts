import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { UserEntity } from './entities/user.entity';
import { UserTokenEntity } from './entities/user-token.entity';
import { UsersController } from './controllers/users.controller';
import { RolesAndPermissionsModule } from '../roles-and-permissions/roles-and-permissions.module';
import { UsersConfigService } from './services/users-config.service';
import { JwtModule } from '@nestjs/jwt';
import { UserMiddleware } from './middlewares/user.middleware';
import { UserOneTimeTokenEntity } from './entities/user-one-time-token.entity';
import { UserLastAccessEntity } from './entities/user-last-access.entity';

const publicProviders = [
  UsersService,
];

const privateProviders = [
  UsersConfigService,
  UsersConfigService,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserTokenEntity,
      UserOneTimeTokenEntity,
      UserLastAccessEntity,
    ]),
    RolesAndPermissionsModule,
    JwtModule.register({
      secret: 'fe9604e502a4fa7b0dd',
      signOptions: {
        // expiresIn: 3600,
      },
    }),
  ],
  controllers: [UsersController],
  providers: [
    ...publicProviders,
    ...privateProviders,
  ],
  exports: publicProviders,
})
export class UsersModule {

  constructor(
    private usersService: UsersService,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    this.usersService.init();
    consumer
      .apply(UserMiddleware)
      .forRoutes('*');
  }
}
