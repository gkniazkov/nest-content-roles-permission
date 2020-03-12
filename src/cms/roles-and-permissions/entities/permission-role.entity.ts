import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PermissionEntity } from './permission.entity';
import { RoleEntity } from './role.entity';

@Entity()
@Unique(['permission', 'role'])
export class PermissionRoleEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column('boolean', { default: false})
  isEnabled: boolean;

  @Column('boolean', { default: false})
  isDefault: boolean;

  @ManyToOne(
    type => PermissionEntity,
    permission => permission.permissionRoles,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn()
  permission: PermissionEntity;

  @Column()
  permissionId: number;

  @ManyToOne(
    type => RoleEntity,
    role => role.permissionRoles,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn()
  role: RoleEntity;

  @Column()
  roleId: number;

  constructor(data?: Partial<PermissionRoleEntity>) {
    if (data) {
      Object.assign(this, data);
    }
  }

}
