import { Injectable, Logger } from '@nestjs/common';

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AppEventEnum } from '@src/common/constants';
import OrderEntity from '@src/common/database/order.entity';
import { OrderStatus } from '@src/common/enums';
import { OrderCommand } from '@src/common/mezon-command/order.command';
import { MezonClientService } from '@src/common/shared/services/mezon.service';
import { replyMessageGenerate } from '@src/common/utils/generateReplyMessage';
import { withinVnDayTypeOrmQuery } from '@src/common/utils/time.util';
import { OrderService } from '@src/modules/order/order.service';
import { ChannelMessage } from 'mezon-sdk';

@Injectable()
export class OrderEventHandler {
  private readonly logger = new Logger(OrderEventHandler.name);
  constructor(
    private orderService: OrderService,
    private mezonService: MezonClientService,
    private emitter: EventEmitter2,
  ) {}

  @OnEvent(AppEventEnum.ORDER_CREATED)
  async handleNewOrder(message: ChannelMessage) {
    this.logger.log(`[${AppEventEnum.ORDER_CREATED}]: `, message);
    const channelId = message.channel_id;
    const senderId = message.sender_id;
    const existingOrder =
      (await this.orderService.findOne({
        where: { channelId, senderId, createdAt: withinVnDayTypeOrmQuery() },
        order: { createdAt: 'DESC' },
      })) || ({} as OrderEntity);
    if (existingOrder) {
      this.logger.log(
        `User ${message.username} has already placed an order today in channel ${channelId}. Ignoring duplicate order.`,
      );
      await this.orderService.delete({ id: existingOrder.id });
    }
    await this.orderService.create({
      ...existingOrder,
      id: message.message_id,
      content: OrderCommand.extractOrderContent(message.content.t),
      senderId: message.sender_id,
      senderName: message.username,
      channelId,
      status: OrderStatus.NEW,
    });
    await this.replySimpleMessage('Đã thêm vào danh sách ghi nợ !!!', message);
  }

  @OnEvent(AppEventEnum.ORDER_CANCELED)
  async handlerCancelOrder(message: ChannelMessage) {
    const senderId = message.sender_id;
    const latestUserOrder =
      await this.orderService.getLatestUserOrderInChannel(senderId);
    if (!latestUserOrder) {
      return;
    }
    const status = OrderStatus.CANCELED;
    await this.orderService.update(latestUserOrder.id, {
      status,
    });
    await this.replySimpleMessage('Xoá đói giảm nợ !!!', message);
    this.emitter.emit(AppEventEnum.ORDER_STATUS_UPDATED, {
      orderId: latestUserOrder.id,
      status,
    });
  }

  async replySimpleMessage(messageContent: string, message: ChannelMessage) {
    const response = replyMessageGenerate(
      {
        messageContent,
      },
      message,
    );
    await this.mezonService.sendMessage(response);
  }
}
