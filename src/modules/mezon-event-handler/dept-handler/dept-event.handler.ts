import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEventEnum } from '@src/common/constants';
import { OrderStatus } from '@src/common/enums';
import { MezonClientService } from '@src/common/shared/services/mezon.service';
import { replyMessageGenerate } from '@src/common/utils/generateReplyMessage';
import { vnLocalDateTime } from '@src/common/utils/time.util';
import { DeptService } from '@src/dept/dept.service';
import { ChannelMessage } from 'mezon-sdk';

@Injectable()
export class DeptEventHandler {
  constructor(
    private readonly deptService: DeptService,
    private mezonService: MezonClientService,
  ) {}

  @OnEvent(AppEventEnum.DEPT_LISTED)
  async handleDeptListedEvent(message: ChannelMessage) {
    const ownerId = message.sender_id;
    const deptOrders = await this.deptService.getListDeptByOwner(ownerId);
    if (!deptOrders.length) {
      const messageToSend = replyMessageGenerate(
        { messageContent: 'Không có đơn hàng nợ nào' },
        message,
      );
      await this.mezonService.sendMessage(messageToSend);
      return;
    }
    const messageContent = `Danh sách order chưa trả tiền:\n${deptOrders
      .map((order) => {
        const isCanceled = order.status === OrderStatus.CANCELED;
        return (
          `${isCanceled ? '~~' : ''}` +
          `<${order.senderName}>: Order ${order.content.toUpperCase()} - ` +
          vnLocalDateTime(order.createdAt) +
          `${isCanceled ? ' (Đã hủy) ~~' : ''}`
        );
      })
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
}
