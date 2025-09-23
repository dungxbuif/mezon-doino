import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@src/common/database/database.module';
import { SharedModule } from '@src/common/shared/shared.module';
import { MesssageModule } from '@src/modules/messsage/messsage.module';
import { MezonEventHandlerModule } from '@src/modules/mezon-event-handler/mezon-event.module';
import { OrderModule } from '@src/modules/order/order.module';
import { DeptModule } from './dept/dept.module';
import { BillModule } from './modules/bill/bill.module';
import { SchedulerJobModule } from './modules/scheduler-job/scheduler-job.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    SharedModule,
    DatabaseModule,
    EventEmitterModule.forRoot(),
    OrderModule,
    MesssageModule,
    BillModule,
    DeptModule,
    SchedulerJobModule,
    UserModule,
    MezonEventHandlerModule,
  ],
})
export class AppModule {}
