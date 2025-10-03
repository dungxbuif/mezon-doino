import { Module } from '@nestjs/common';
import BillingEventModule from '@src/mezon-event-handler/billing-event/billing-event.module';
import { DeptEventModule } from '@src/mezon-event-handler/dept-event/dept-event.module';
import { BotHandler } from '@src/mezon-event-handler/mezon-event.handler';
import OrderEventModule from '@src/mezon-event-handler/order-event/order-event.module';
import { OrderFormEventModule } from '@src/mezon-event-handler/order-form-event/order-form.event.module';

@Module({
  imports: [
    OrderEventModule,
    BillingEventModule,
    DeptEventModule,
    OrderFormEventModule,
  ],
  providers: [BotHandler],
})
export class MezonEventModule {}
