import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeptModule } from '@src/dept/dept.module';
import { BillingModule } from '@src/modules/billing/billing.module';
import SchedulerJobEntity from '@src/modules/scheduler-job/scheduler-job.entity';
import { SchedulerJobSHandler } from '@src/modules/scheduler-job/scheduler-job.handler';
import { UserModule } from '@src/user/user.module';
import { SchedulerJobService } from './scheduler-job.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SchedulerJobEntity]),
    DeptModule,
    UserModule,
    ScheduleModule.forRoot(),
    BillingModule,
  ],
  providers: [SchedulerJobService, SchedulerJobSHandler],
})
export class SchedulerJobModule {}
