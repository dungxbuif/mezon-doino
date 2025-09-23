/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEventEnum } from '@src/common/constants';
import OrderEntity from '@src/common/database/order.entity';
import { OrderStatus } from '@src/common/enums';
import DeptCommand from '@src/common/mezon-command/dept.command';
import { MezonClientService } from '@src/common/shared/services/mezon.service';
import { replyMessageGenerate } from '@src/common/utils/generateReplyMessage';
import { vnLocalDateTime } from '@src/common/utils/time.util';
import { DeptService } from '@src/dept/dept.service';
import { BillService } from '@src/modules/bill/bill.services';
import { SchedulerJobService } from '@src/modules/scheduler-job/scheduler-job.service';
import { UserService } from '@src/user/user.service';
import { ChannelMessage } from 'mezon-sdk';

@Injectable()
export class SchedulerJobSHandler {
  private logger = new Logger(SchedulerJobSHandler.name);
  constructor(
    private mezonService: MezonClientService,
    private deptService: DeptService,
    private schedulerJobService: SchedulerJobService,
    private userService: UserService,
    private billSerrvice: BillService,
  ) {}

  @OnEvent(AppEventEnum.DEPT_SCHEDULED)
  async handleDeptScheduled(message: ChannelMessage) {
    const ownerId = message.sender_id;
    const config = DeptCommand.parseCommands(message);
    if (!config) {
      return this.invalidCommandWarning(message);
    }
    const { target, users, repeat } = config;
    if (target === 'users' && !users?.length) {
      return this.invalidCommandWarning(message);
    }
    if (target === 'all') {
      const deptOrders = (
        (await this.deptService.getListDeptByOwner(message.sender_id)) || []
      ).filter((order) => order.status !== OrderStatus.CANCELED);
      if (!deptOrders.length) {
        const messageToSend = replyMessageGenerate(
          { messageContent: 'Không có đơn hàng nợ nào' },
          message,
        );
        await this.mezonService.sendMessage(messageToSend);
        return;
      }

      await this.handleAndDeliveryDeptWarning(
        deptOrders,
        repeat as string,
        message,
      );
    }
    const mezonUsers = await this.userService.getManyByIdsAndUsernames({
      ids: users,
      usernames: users,
    });
    if (!mezonUsers.length) {
      this.logger.warn(`No users found for message: ${message.content?.t}`);
      return;
    }
    const billQueryBuilder = await this.billSerrvice.getQueryBuilder();
    const bills = await billQueryBuilder
      .leftJoinAndSelect(
        'bill.orders',
        'order',
        'order.senderId IN (:...mezonUserIds) AND order.status != :canceledStatus',
        {
          mezonUserIds: mezonUsers.map((u) => u.id),
          canceledStatus: OrderStatus.CANCELED,
        },
      )
      .where('bill.ownerId = :ownerId', { ownerId }) // Apply where condition for the bill
      .getMany();
    const orders = bills.flatMap((b) => b.orders);
    await this.handleAndDeliveryDeptWarning(orders, repeat as string, message);
  }

  @OnEvent(AppEventEnum.DEPT_REMINDER_LIST)
  async handleDeptReminderList(message: ChannelMessage) {
    const ownerId = message.sender_id;
    const billQueryBuilder = await this.billSerrvice.getQueryBuilder();
    const bills = await billQueryBuilder
      .leftJoinAndSelect(
        'bill.orders',
        'order',
        'order.status != :canceledStatus',
        {
          canceledStatus: OrderStatus.CANCELED,
        },
      )
      .where('bill.ownerId = :ownerId', { ownerId }) // Apply where condition for the bill
      .getMany();
    const orderIds = bills.flatMap((b) => b.orders).map((o) => o.id);
    const schedulerJobs =
      await this.schedulerJobService.getJobsByOrderIds(orderIds);
    if (!schedulerJobs.length) {
      const messageToSend = replyMessageGenerate(
        { messageContent: 'Không có đơn hàng nợ nào được nhắc nhở' },
        message,
      );
      await this.mezonService.sendMessage(messageToSend);
      return;
    }
    const messageContent = `Danh sách order chưa trả tiền được nhắc nhở:\n${schedulerJobs
      .map(
        (job) =>
          `<${job.senderName}>: Order ${job.content.toUpperCase()} - ` +
          [
            ` (Nhắc nhở tiếp theo vào ${vnLocalDateTime(job.nextTime)})`,
            ` Tần suất nhắc nhở: ${job.repeat}`,
            ` ID: ${job.id}`,
          ].join(' - '),
      )
      .join('\n')}`;

    const messageToSend = replyMessageGenerate(
      {
        messageContent,
        mk: [{ type: 'pre', s: 0, e: messageContent.length + 6 }],
      },
      message,
    );
    await this.mezonService.sendMessage(messageToSend);
  }

  @OnEvent(AppEventEnum.DEPT_REMINDER_CANCEL)
  async handleDeptReminderCancel(message: ChannelMessage) {
    const jobId = DeptCommand.parseCancelReminderCommand(message.content.t);
    if (!jobId) {
      const messageToSend = replyMessageGenerate(
        { messageContent: 'ID không hợp lệ' },
        message,
      );
      await this.mezonService.sendMessage(messageToSend);
      return;
    }
    const schedulerJob = await this.schedulerJobService.getJobById(jobId);
    if (!schedulerJob) {
      const messageToSend = replyMessageGenerate(
        { messageContent: 'Không tìm thấy nhắc nhở với ID đã cung cấp' },
        message,
      );
      await this.mezonService.sendMessage(messageToSend);
      return;
    }
    await this.schedulerJobService.deleteJobById(jobId);
    const messageToSend = replyMessageGenerate(
      { messageContent: `Đã hủy nhắc nhở thành công` },
      message,
    );
    await this.mezonService.sendMessage(messageToSend);
  }

  private async handleAndDeliveryDeptWarning(
    orders: OrderEntity[],
    repeat: string,
    message: ChannelMessage,
  ) {
    const messageContent = !orders?.length
      ? 'Không tìm thấy user nào của người dùng'
      : `Danh sách order chưa trả tiền:\n${orders
          .map(
            (order) =>
              `<${order.senderName}>: Order ${order.content.toUpperCase()} - ` +
              vnLocalDateTime(order.createdAt),
          )
          .join('\n')}`;
    const messageToSend = replyMessageGenerate(
      {
        messageContent,
        mk: [{ type: 'pre', s: 0, e: messageContent.length + 6 }],
      },
      message,
    );
    await this.mezonService.sendMessage(messageToSend);

    await this.schedulerJobService.createJobs(
      orders.map((o) => ({
        repeat,
        userId: o.senderId,
        senderName: o.senderName,
        channelId: o.channelId,
        content: o.content,
        orderId: o.id,
        nextTime: this.schedulerJobService.calTimeByRepeat(repeat),
      })),
    );
    await this.schedulerJobService.pingUserWarning(orders);
  }
  // private async validateUsers(targetUsers: string[]) {
  //   const mezonClient = this.mezonService.getClient();
  //   const user = await mezonClient.clans.fetch('1969393191673139200');
  //   console.log({ targetUsers, user });
  // }
  private async invalidCommandWarning(message: ChannelMessage) {
    const mesageContetnt =
      'Hãy nhập đúng lệnh theo format:\n' +
      '*doino all <repeat>' +
      ' hoặc `*doino @user1 @user2 <repeat>`\n' +
      'Trong đó `<repeat>` là tần suất nhắc nhở. \nHỗ trợ phút(p), giờ(h), ngày(d)' +
      ' Ví dụ: `*doino all 2h`';

    const messageToSend = replyMessageGenerate(
      {
        messageContent: mesageContetnt,
        mk: [{ type: 'pre', s: 0, e: mesageContetnt.length + 6 }],
      },
      message,
    );
    await this.mezonService.sendMessage(messageToSend);
  }
}
