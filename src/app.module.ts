import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@src/common/database/database.module';
import { SharedModule } from '@src/common/shared/shared.module';
import { MezonEventModule } from '@src/mezon-event-handler/mezon-event.module';
import { BillingModule } from '@src/modules/billing/billing.module';
import { MessageModule } from '@src/modules/message/message.module';
import { OrderModule } from '@src/modules/order/order.module';
import { DeptModule } from './dept/dept.module';
import { SchedulerJobModule } from './modules/scheduler-job/scheduler-job.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    SharedModule,
    DatabaseModule,
    EventEmitterModule.forRoot(),
    OrderModule,
    MessageModule,
    BillingModule,
    DeptModule,
    SchedulerJobModule,
    UserModule,
    MezonEventModule,
  ],
})
export class AppModule {}
