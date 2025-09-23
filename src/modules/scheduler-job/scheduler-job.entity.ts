import { AbstractEntity } from '@src/common/database/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity('scheduler-jobs')
export default class SchedulerJobEntity extends AbstractEntity {
  @Column()
  repeat: string;
  @Column()
  userId: string;
  @Column()
  senderName: string;
  @Column()
  channelId: string;
  @Column()
  content: string;
  @Column({})
  orderId: string;
  @Column()
  nextTime: Date;
}
