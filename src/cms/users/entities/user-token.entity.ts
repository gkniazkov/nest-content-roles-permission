import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity()
@Unique(['token'])
export class UserTokenEntity {

  @PrimaryGeneratedColumn()
  id: number;

  // @ManyToOne(type => UserEntity, user => user.userToken, {
  @ManyToOne(type => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: UserEntity;

  @Column('varchar', { length: 64 })
  token: string;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP'})
  createdAt: Date;

  constructor(data?: Partial<UserTokenEntity>) {
    if (data) {
      Object.assign(this, data);
    }
  }

}
