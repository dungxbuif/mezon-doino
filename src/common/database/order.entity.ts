import { AbstractAuditEntity } from '@src/common/database/abstract.entity';
import BillEntity from '@src/common/database/bill.entity';
import { OrderStatus } from '@src/common/enums';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('orders')
export default class OrderEntity extends AbstractAuditEntity {
  @PrimaryColumn('varchar')
  //message id
  id: string;

  @Column()
  channelId: string;

  @Column()
  senderId: string;

  @Column()
  senderName: string;

  @Column()
  content: string;

  @Column({ type: 'int', default: OrderStatus.NEW })
  status: OrderStatus;

  @Column({ nullable: true, type: 'int', default: null })
  amount: number | null;

  @Column({ nullable: true, type: 'int', default: null })
  billId: number | null;

  @ManyToOne(() => BillEntity, (bill) => bill.orders)
  @JoinColumn({ name: 'bill_id' })
  bill!: BillEntity | null;
}
