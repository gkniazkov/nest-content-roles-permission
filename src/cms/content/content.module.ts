import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { RolesAndPermissionsModule } from '../roles-and-permissions/roles-and-permissions.module';
import { ContentService } from './content.service';

@Module({
  imports: [
    UsersModule,
    RolesAndPermissionsModule,
  ],
  providers: [ContentService],
})
export class ContentModule {}
