import { Module } from '@nestjs/common';
import { OrderEventHandler } from '@src/modules/mezon-event-handler/order-handler/order-event.handler';
import { OrderModule } from '@src/modules/order/order.module';

@Module({
  imports: [OrderModule],
  providers: [OrderEventHandler],
})
export default class OrderCommandHandlerModule {}
