import { Module } from '@nestjs/common';
import { BillingHandler } from '@src/mezon-event-handler/billing-event/billing.handler';
import { BillingModule } from '@src/modules/billing/billing.module';
import { OrderModule } from '@src/modules/order/order.module';

@Module({
  imports: [BillingModule, OrderModule],
  providers: [BillingHandler],
})
export default class BillingEventModule {}
