import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEventEnum } from '@src/common/constants';
import MessageEntity from '@src/common/database/message.entity';
import OrderEntity from '@src/common/database/order.entity';
import { MezonClientService } from '@src/common/shared/services/mezon.service';
import { replyMessageGenerate } from '@src/common/utils/generateReplyMessage';
import { DeptService } from '@src/dept/dept.service';
import { OrderFormHelper } from '@src/mezon-event-handler/order-form-event/order-form.helper';
import { MessageService } from '@src/modules/message/message.service';
import { OrderService } from '@src/modules/order/order.service';
import { ChannelMessage } from 'mezon-sdk';
import { FindOptionsWhere, In } from 'typeorm';

interface OrderFormReplyPayload {
  message: ChannelMessage;
  orders: OrderEntity[];
  channelId: string;
  ownerId: string;
  type: 'reply';
}
interface OrderFormDmPayload {
  ownerId: string;
  orders: OrderEntity[];
  type: 'dm';
}
export interface OrderFormEventPayload {
  type: 'reply' | 'dm';
  reply?: OrderFormReplyPayload;
  dm?: OrderFormDmPayload;
}

@Injectable()
export class OrderFormHandler {
  private readonly logger = new Logger(OrderFormHandler.name);
  constructor(
    private readonly messageService: MessageService,
    private readonly orderService: OrderService,
    private readonly deptService: DeptService,
    private readonly mezonService: MezonClientService,
  ) {}

  @OnEvent(AppEventEnum.ORDER_FORM_CREATED)
  async createOrderForm(payload: OrderFormEventPayload) {
    if (payload.type === 'reply' && payload.reply) {
      await this.createChangeOrderFormReplyMessage(payload.reply);
    }
    if (payload.type === 'dm' && payload.dm) {
      await this.createOrderFormRDMMessage(payload.dm);
    }
  }

  private async createChangeOrderFormReplyMessage({
    message,
    orders,
    channelId,
    ownerId,
  }: OrderFormReplyPayload) {
    await this.deletePreviousBillMessages({
      channelId,
      ownerId,
      type: 'reply',
    });
    const embedMessage = OrderFormHelper.generateOrderFormlMessage(orders);
    const billMessage = replyMessageGenerate(embedMessage, message);
    const createdBillMessage = await this.mezonService.sendMessage(billMessage);
    await this.messageService.create({
      messageId: createdBillMessage.message_id,
      ownerId,
      channelId,
      type: 'reply',
      billId: orders[0]?.billId,
    });
    this.logger.log(
      `Bill created/updated successfully for channel ${channelId} by owner ${ownerId}`,
    );
  }

  private async createOrderFormRDMMessage({
    ownerId,
    orders,
  }: OrderFormDmPayload) {
    await this.deletePreviousBillMessages({
      ownerId,
      type: 'dm',
    });
    const embedMessage = OrderFormHelper.generateOrderFormlMessage(orders);
    const mezonMessage = await this.mezonService.sendMessageToUser(
      ownerId,
      embedMessage,
    );
    await this.messageService.create({
      messageId: mezonMessage.message_id,
      ownerId,
      channelId: mezonMessage.channel_id,
      type: 'dm',
    });
  }

  private async deletePreviousBillMessages(
    condition: FindOptionsWhere<MessageEntity>,
  ) {
    const oldMessage = await this.messageService.getList({
      where: condition,
    });
    await Promise.all([
      ...oldMessage.map(async (msg) =>
        this.mezonService.deleteMessage(msg.channelId, msg.messageId),
      ),
      this.messageService.delete({
        messageId: In(oldMessage.map((msg) => msg.messageId)),
      }),
    ]);
  }

  @OnEvent(AppEventEnum.DEPT_LIST_UPDATED)
  @OnEvent(AppEventEnum.BILLING_UPDATED)
  async updateUserDeptList(ownerOrBillId: string | number) {
    const orders =
      typeof ownerOrBillId === 'string'
        ? await this.deptService.getListDeptByOwner(ownerOrBillId)
        : await this.orderService.getOrdersByBillId(ownerOrBillId);

    const deptMessage = OrderFormHelper.generateOrderFormlMessage(orders);
    const existingMessages = await this.messageService.getList({
      where:
        typeof ownerOrBillId === 'string'
          ? { ownerId: ownerOrBillId, type: 'dm' }
          : { billId: ownerOrBillId, type: 'reply' },
    });
    if (!existingMessages.length) {
      this.logger.log(
        `No Order Form messages found for owner/bill ${ownerOrBillId}, skipping update.`,
      );
      return;
    }
    const mezonMessages = await Promise.all(
      existingMessages.map(async (message) =>
        this.mezonService.getMessageById(message.channelId, message.messageId),
      ),
    );
    await Promise.all(
      mezonMessages.map(async (mezonMsg) => mezonMsg?.update(deptMessage)),
    );
  }
}
