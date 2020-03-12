import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PermissionRoleEntity } from './permission-role.entity';

@Entity()
@Unique(['name'])
export class RoleEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 64 })
  name: string;

  @Column('text')
  description: string;

  @Column('varchar', { length: 64, default: 'Custom' })
  group: string;

  @Column('boolean', { default: false})
  isDefault: boolean;

  @Column('boolean', { default: false})
  isSystem: boolean = false;

  @OneToMany(type => PermissionRoleEntity, permissionRole => permissionRole.role)
  @JoinColumn()
  permissionRoles: PermissionRoleEntity[];

  constructor(data?: Partial<RoleEntity>) {
    if (data) {
      Object.assign(this, data);
    }
  }

}
