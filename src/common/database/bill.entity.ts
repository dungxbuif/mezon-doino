import { AbstractEntity } from '@src/common/database/abstract.entity';
import BillingMessageEntity from '@src/common/database/bill-message.entity';
import OrderEntity from '@src/common/database/order.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('bills')
export default class BillEntity extends AbstractEntity {
  @Column()
  channelId: string;

  @Column()
  ownerId: string;

  @OneToMany(() => OrderEntity, (order) => order.bill)
  orders!: OrderEntity[];

  @OneToMany(
    () => BillingMessageEntity,
    (billingMessage) => billingMessage.bill,
  )
  messages!: BillingMessageEntity[];
}
