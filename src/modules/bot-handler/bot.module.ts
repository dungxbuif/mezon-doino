import { Module } from '@nestjs/common';
import BillCommandHandlerModule from '@src/modules/mezon-event-handler/bill-handler/bill-handler.module';
import { DeptEventHandlerModule } from '@src/modules/mezon-event-handler/dept-handler/dept-event-handler.module';
import { BotHandler } from '@src/modules/mezon-event-handler/mezon-event.handler';
import OrderCommandHandlerModule from '@src/modules/mezon-event-handler/order-handler/order-handler.module';

@Module({
  imports: [
    OrderCommandHandlerModule,
    BillCommandHandlerModule,
    DeptEventHandlerModule,
  ],
  providers: [BotHandler],
})
export class BotHandlerModule {}
