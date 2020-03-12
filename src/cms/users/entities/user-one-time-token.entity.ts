import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity()
@Unique(['token'])
export class UserOneTimeTokenEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: UserEntity;

  @Column('varchar', { length: 64 })
  token: string;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP'})
  createdAt: Date;

  constructor(data?: Partial<UserOneTimeTokenEntity>) {
    if (data) {
      Object.assign(this, data);
    }
  }

}
