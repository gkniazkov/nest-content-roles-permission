import { Column, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { OwnerFields } from '../../roles-and-permissions/decorators/owner-fields.decorator';

@OwnerFields('authorId')
export class ContentEntity {

  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(type => UserEntity, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  author: UserEntity;

  @Column()
  @Column({default: null})
  authorId: number;

  @ManyToOne(type => UserEntity, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  moderator: UserEntity;

  @Column({default: null})
  moderatorId: number;

  @Column('boolean', { default: true})
  public isPublished: boolean;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP'})
  public createdAt: Date;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
  public updatedAt: Date;

  public async validate(...args): Promise<true | string> {
    return true;
  }
}
