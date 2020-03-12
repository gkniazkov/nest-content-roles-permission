import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity, JoinColumn,
  JoinTable,
  ManyToMany, ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import * as crypto from 'crypto';
import { RoleEntity } from '../../roles-and-permissions/entities/role.entity';

@Entity()
@Unique(['username'])
export class UserEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 64 })
  username: string;

  @BeforeInsert()
  hashPasswordBeforeInsert() {
    if (this.password && !this.skipHashPassword) {
      this.setPassword(this.password);
    }
  }

  @BeforeUpdate()
  hashPasswordBeforeUpdate() {
    if (this.password && !this.skipHashPassword) {
      this.setPassword(this.password);
    }
  }

  @Column({ select: false })
  password: string;

  @Column('boolean', { default: false })
  isDefault: boolean;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('boolean', { default: false })
  useSha1: boolean;

  @Column('varchar', { nullable: true, default: '' }) // aDYhG93b0qyJfIxfs2guVoUubWwvniR2G0FgaC9mi
  solt = '';

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // @Column(type => UserEntity, { default: null, nullable: true })
  // delegator: UserEntity;
  @ManyToOne(type => UserEntity, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  delegator: UserEntity;

  @ManyToMany(type => RoleEntity)
  @JoinTable()
  roles: RoleEntity[];

  authToken: string;

  skipHashPassword = false;

  constructor(data?: Partial<UserEntity>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  public isAuthorized() {
    return !!this.id;
  }

  checkIfUnencryptedPasswordIsValid(unencryptedPassword: string) {
    const encryptedPassword = this.generateHash(unencryptedPassword, this.useSha1);
    return encryptedPassword === this.password;
  }

  generateHash(password: string, useSha1 = false) {
    const str = this.solt ? this.solt + password : password;
    if (useSha1) {
      return crypto.createHash('sha1').update(str, 'utf8').digest('hex');
    } else {
      return crypto.createHmac('sha256', str).digest('hex');
    }
  }

  setPassword(password) {
    this.password = this.generateHash(password, this.useSha1);
  }

}
