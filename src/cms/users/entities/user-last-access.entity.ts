import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity()
// @Unique(['userId'])
export class UserLastAccessEntity {

  @PrimaryGeneratedColumn()
  id: number;

  // @ManyToOne(type => UserEntity, {
  @OneToOne(type => UserEntity, {
    onDelete: 'CASCADE',
    lazy: true,
  })
  @JoinColumn()
  user: UserEntity;

  @Column()
  userId: number;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
  lastAccessAt: Date;

  constructor(data?: Partial<UserLastAccessEntity>) {
    if (data) {
      Object.assign(this, data);
    }
  }

}
