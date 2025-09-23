import { Module } from '@nestjs/common';
import { BillModule } from '@src/modules/bill/bill.module';
import { BillCommandHandler } from '@src/modules/mezon-event-handler/bill-handler/bill.handler';
import { OrderModule } from '@src/modules/order/order.module';

@Module({
  imports: [BillModule, OrderModule],
  providers: [BillCommandHandler],
})
export default class BillCommandHandlerModule {}
