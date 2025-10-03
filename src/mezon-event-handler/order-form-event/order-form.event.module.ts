import { Module } from '@nestjs/common';
import { OrderFormHandler } from '@src/mezon-event-handler/order-form-event/order-form.handler';

@Module({
  providers: [OrderFormHandler],
})
export class OrderFormEventModule {}
