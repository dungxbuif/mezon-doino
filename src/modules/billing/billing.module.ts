import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import BillEntity from '@src/common/database/bill.entity';
import BillingMessageEntity from '@src/common/database/message.entity';
import { BillingService } from '@src/modules/billing/billing.services';

@Module({
  imports: [TypeOrmModule.forFeature([BillEntity, BillingMessageEntity])],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
