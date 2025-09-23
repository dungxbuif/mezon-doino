import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import BillEntity from '@src/common/database/bill.entity';
import { DeptService } from './dept.service';

@Module({
  imports: [TypeOrmModule.forFeature([BillEntity])],
  providers: [DeptService],
  exports: [DeptService],
})
export class DeptModule {}
