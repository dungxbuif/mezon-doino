import { Module } from '@nestjs/common';
import { OrderEventHandler } from '@src/mezon-event-handler/order-event/order-event.handler';
import { OrderModule } from '@src/modules/order/order.module';

@Module({
  imports: [OrderModule],
  providers: [OrderEventHandler],
})
export default class OrderEventModule {}
