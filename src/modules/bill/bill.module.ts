import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import BillingMessageEntity from '@src/common/database/bill-message.entity';
import BillEntity from '@src/common/database/bill.entity';
import { BillService } from '@src/modules/bill/bill.services';
import { BillingMessageService } from '@src/modules/bill/billing-message.service';

@Module({
  imports: [TypeOrmModule.forFeature([BillEntity, BillingMessageEntity])],
  providers: [BillService, BillingMessageService],
  exports: [BillService, BillingMessageService],
})
export class BillModule {}
