import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEventEnum } from '@src/common/constants';
import OrderEntity from '@src/common/database/order.entity';
import { MezonClientService } from '@src/common/shared/services/mezon.service';
import { replyMessageGenerate } from '@src/common/utils/generateReplyMessage';
import { OrderFormHelper } from '@src/mezon-event-handler/order-form-event/order-form.helper';
import { MessageService } from '@src/modules/message/message.service';
import { ChannelMessage } from 'mezon-sdk';

@Injectable()
export class OrderFormHandler {
  private readonly logger = new Logger(OrderFormHandler.name);
  constructor(
    private readonly mezonService: MezonClientService,
    private readonly messageService: MessageService,
  ) {}

  @OnEvent(AppEventEnum.ORDER_FORM_CREATED)
  async createOrderForm({
    message,
    orders,
    channelId,
    ownerId,
  }: {
    message: ChannelMessage;
    orders: OrderEntity[];
    channelId: string;
    ownerId: string;
  }) {
    await this.deletePreviousBillMessages({ channelId, ownerId });
    const embedMessage = OrderFormHelper.generateOrderFormlMessage(orders);
    const billMessage = replyMessageGenerate(embedMessage, message);
    const createdBillMessage = await this.mezonService.sendMessage(billMessage);
    await this.messageService.create({
      messageId: createdBillMessage.message_id,
      ownerId,
      channelId,
    });
    this.logger.log(
      `Bill created/updated successfully for channel ${channelId} by owner ${ownerId}`,
    );
  }

  private async deletePreviousBillMessages({
    channelId,
    ownerId,
  }: {
    channelId: string;
    ownerId: string;
  }) {
    const oldMessage = await this.messageService.getList({
      where: { channelId, ownerId, type: 'reply' },
    });
    await Promise.all([
      ...oldMessage.map(async (msg) =>
        this.mezonService.deleteMessage(channelId, msg.messageId),
      ),
      this.messageService.delete({
        channelId,
        type: 'reply',
      }),
    ]);
  }
}
