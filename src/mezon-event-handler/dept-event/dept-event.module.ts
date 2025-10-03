import { Module } from '@nestjs/common';
import { DeptModule } from '@src/dept/dept.module';
import { BillingModule } from '@src/modules/billing/billing.module';
import { DeptEventHandler } from './dept-event.handler';

@Module({
  imports: [DeptModule, BillingModule],
  providers: [DeptEventHandler],
})
export class DeptEventModule {}
