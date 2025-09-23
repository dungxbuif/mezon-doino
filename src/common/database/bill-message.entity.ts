import { AbstractAuditEntity } from '@src/common/database/abstract.entity';
import BillEntity from '@src/common/database/bill.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('bill-messages')
export default class BillingMessageEntity extends AbstractAuditEntity {
  @PrimaryColumn('varchar')
  messageId: string;

  @Column({ type: 'varchar', default: 'reply' })
  type: 'reply' | 'dm';

  @Column()
  ownerId: string;

  @Column()
  billId: number;

  @ManyToOne(() => BillEntity, (bill) => bill.messages)
  @JoinColumn({ name: 'bill_id' })
  bill!: BillEntity;
}
