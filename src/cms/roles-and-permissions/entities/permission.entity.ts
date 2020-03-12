import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PermissionRoleEntity } from './permission-role.entity';

@Entity()
@Unique(['key'])
export class PermissionEntity {

  @PrimaryGeneratedColumn()
  id?: number;

  @Column('varchar', { length: 127 })
  key: string;

  @Column()
  description: string;

  @Column('varchar', { default: 'Custom', length: 64 })
  group: string;

  @OneToMany(type => PermissionRoleEntity, permissionRole => permissionRole.permission)
  @JoinColumn()
  permissionRoles: PermissionRoleEntity[];

  constructor(data?: Partial<PermissionEntity>) {
    if (data) {
      Object.assign(this, data);
    }
  }

}
