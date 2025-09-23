import BillingMessageEntity from '@src/common/database/bill-message.entity';
import BillEntity from '@src/common/database/bill.entity';
import OrderEntity from '@src/common/database/order.entity';
import SchedulerJobEntity from '@src/modules/scheduler-job/scheduler-job.entity';
import { UserEntity } from '@src/user/user.entity';

const entities = [
  OrderEntity,
  BillEntity,
  BillingMessageEntity,
  SchedulerJobEntity,
  UserEntity,
];
export default entities;
