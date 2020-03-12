import { Module } from '@nestjs/common';
import { ContentModule } from './content/content.module';
import { RolesAndPermissionsModule } from './roles-and-permissions/roles-and-permissions.module';
import { CommentsModule } from './comments/comments.module';
import { I18nModule } from './i18n/i18n.module';
import { UsersModule } from './users/users.module';

const privateModules = [];

const publicModules = [
  ContentModule,
  RolesAndPermissionsModule,
  CommentsModule,
  I18nModule,
  UsersModule,
];

@Module({
  imports: [
    ...privateModules,
    ...publicModules,
  ],
  exports: [
    ...publicModules,
  ],
})
export class CmsModule {

  constructor() {}
}
