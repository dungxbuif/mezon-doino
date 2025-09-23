import { Module } from '@nestjs/common';
import { DeptModule } from '@src/dept/dept.module';
import { DeptEventHandler } from './dept-event.handler';

@Module({
  imports: [DeptModule],
  providers: [DeptEventHandler],
})
export class DeptEventHandlerModule {}
