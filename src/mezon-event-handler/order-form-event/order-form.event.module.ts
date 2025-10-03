import { Module } from '@nestjs/common';
import { DeptModule } from '@src/dept/dept.module';
import { OrderFormHandler } from '@src/mezon-event-handler/order-form-event/order-form.handler';
import { MessageModule } from '@src/modules/message/message.module';
import { OrderModule } from '@src/modules/order/order.module';

@Module({
  imports: [MessageModule, OrderModule, DeptModule],
  providers: [OrderFormHandler],
})
export class OrderFormEventModule {}
