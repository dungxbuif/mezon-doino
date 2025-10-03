/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AppEventEnum } from '@src/common/constants';
import OrderEntity from '@src/common/database/order.entity';
import { MezonFormKey, OrderStatus } from '@src/common/enums';
import BillingButton from '@src/common/mezon-command/billing-button.command';
import { MezonClientService } from '@src/common/shared/services/mezon.service';
import { replyMessageGenerate } from '@src/common/utils/generateReplyMessage';
import { withinVnDayTypeOrmQuery } from '@src/common/utils/time.util';
import { BillingService } from '@src/modules/billing/billing.services';
import { OrderService } from '@src/modules/order/order.service';
import { ChannelMessage } from 'mezon-sdk';
import { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';
import { In, IsNull } from 'typeorm';

@Injectable()
export class BillingHandler {
  private readonly logger = new Logger(BillingHandler.name);
  constructor(
    private orderService: OrderService,
    private billingService: BillingService,
    private mezonService: MezonClientService,
    private eventEmitter: EventEmitter2,
    // private messageService: MessageService,
  ) {}

  @OnEvent(AppEventEnum.BILL_CREATED)
  async handleCreateBill(message: ChannelMessage) {
    const { sender_id: ownerId, channel_id: channelId } = message;
    const replyMessagePayload = {
      message,
      channelId,
      ownerId,
    };
    let finalOrders: OrderEntity[] = [];
    const todayOrders =
      await this.orderService.getTodayOrdersByChannel(channelId);
    const haveNewOrder = todayOrders.some(
      (order) => order.status === 0 && !order.billId,
    );
    const areOrdersHaveBill = todayOrders.every((order) => order.billId);

    let latestBill =
      await this.billingService.getLatestBillByChannel(channelId);

    if (!todayOrders?.length) {
      this.logger.log(
        `No orders found for channel ${channelId} today. No bill created.`,
      );
      const messageContent = 'Không có order';
      const response = replyMessageGenerate(
        {
          messageContent,
        },
        message,
      );
      await this.mezonService.sendMessage(response);
      return;
    }

    if (haveNewOrder) {
      this.logger.log(
        `Creating new bill for channel ${channelId} by owner ${ownerId}`,
      );
      latestBill = await this.billingService.create({
        channelId,
        ownerId,
      });
      const billId = latestBill.id;
      finalOrders = todayOrders
        .filter((order) => order.status === OrderStatus.NEW && !order.billId)
        .map((order) => {
          order.billId = billId;
          return order;
        });
      await this.orderService.update(
        {
          id: In(finalOrders.map((ord) => ord.id)),
        },
        { billId },
      );
      await this.eventEmitter.emitAsync(AppEventEnum.ORDER_FORM_CREATED, {
        ...replyMessagePayload,
        bill: latestBill,
        orders: finalOrders,
      });
      return;
    }

    if (areOrdersHaveBill && latestBill) {
      this.logger.log(
        `Updating latest bill ${latestBill.id} for channel ${channelId} by owner ${ownerId}`,
      );
      await this.billingService.update(latestBill.id, {
        ownerId,
      });
      finalOrders = todayOrders.filter(
        (order) => order.billId === latestBill?.id,
      );

      await this.eventEmitter.emitAsync(AppEventEnum.ORDER_FORM_CREATED, {
        ...replyMessagePayload,
        bill: latestBill,
        orders: finalOrders,
      });
    }
  }

  @OnEvent(AppEventEnum.BILL_ADD_ORDER)
  async addOrderToLatestBill(message: ChannelMessage) {
    const ownerId = message.sender_id;
    const channelId = message.channel_id;
    const latestBill =
      await this.billingService.getLatestBillByChannel(channelId);
    if (!latestBill) {
      const messageToSend = replyMessageGenerate(
        {
          messageContent: 'Bạn không có hóa đơn nào gần đây',
        },
        message,
      );
      await this.mezonService.sendMessage(messageToSend);
      return;
    }
    if (latestBill.ownerId !== ownerId) {
      const messageToSend = replyMessageGenerate(
        {
          messageContent: 'Bạn không có hóa đơn nào gần đây',
        },
        message,
      );
      await this.mezonService.sendMessage(messageToSend);
      return;
    }
    const newOrders = await this.orderService.getNewOrdersByChannel(channelId);
    if (!newOrders?.length) {
      const messageToSend = replyMessageGenerate(
        {
          messageContent: 'Không có order mới để thêm vào bill',
        },
        message,
      );
      await this.mezonService.sendMessage(messageToSend);
      return;
    }
    await this.orderService.update(
      {
        channelId,
        status: OrderStatus.NEW,
        billId: IsNull(),
        createdAt: withinVnDayTypeOrmQuery(),
      },
      { billId: latestBill.id },
    );
    const messageContent = `Đã thêm ${newOrders.length} order vào bill`;
    const response = replyMessageGenerate(
      {
        messageContent,
      },
      message,
    );
    await this.mezonService.sendMessage(response);
  }

  @OnEvent(AppEventEnum.BILLING_BUTTON_CLICKED)
  async onBillingButtonClicked(message: MessageButtonClicked) {
    const newStatus = this.getButonClickStatus(message.button_id);
    const orderId = this.getButtonClickOrderId({
      extraData: message.extra_data,
      messageId: message.message_id,
    });
    const userId = message.user_id;
    const order = await this.orderService.findOne({
      where: { id: orderId },
      relations: ['bill'],
    });
    if (!order) {
      this.logger.warn(`Order ${orderId} not found`);
      return;
    }

    if (order.bill?.ownerId !== userId) {
      this.logger.warn(
        `User ${userId} is not authorized to confirm order ${orderId}`,
      );
      return;
    }

    await this.handlerOrderStatusUpdated({
      orderId,
      status: newStatus,
    });
  }
  @OnEvent(AppEventEnum.ORDER_STATUS_UPDATED)
  async handlerOrderStatusUpdated({
    orderId,
    status,
  }: {
    orderId: string;
    status: OrderStatus;
  }) {
    const order = await this.orderService.findOne({
      where: { id: orderId },
    });
    if (!order) {
      this.logger.warn(`Order ${orderId} not found`);
      return;
    }
    await this.orderService.update(orderId, { status });
    if (!order.billId) {
      this.logger.warn(`Order ${orderId} has no billId`);
    }
    // const orders = await this.orderService.getOrdersByBillId(order.billId);
    // const billMessages = await this.messageService.getList({
    //   where: { channelId: order.channelId, ownerId: order.ownerId },
    // });
    // const newContent = OrderFormHelper.generateOrderFormlMessage(orders || []);
    // const mezonMessages = await Promise.all(
    //   billMessages.map(async (billMsg) =>
    //     this.mezonService.getMessageById(order.channelId, billMsg.messageId),
    //   ),
    // );
    // await Promise.all(
    //   mezonMessages.map(async (mezonMsg) => mezonMsg?.update(newContent)),
    // );
  }

  private getButonClickStatus(buttonId: string) {
    let newStatus = OrderStatus.NEW;
    const isConfirm = BillingButton.confirmKey === buttonId;
    const isCancel = BillingButton.cancelKey === buttonId;
    if (isConfirm) {
      newStatus = OrderStatus.CONFIRMED;
    }
    if (isCancel) {
      newStatus = OrderStatus.CANCELED;
    }
    return newStatus;
  }

  private getButtonClickOrderId({
    extraData,
    messageId,
  }: {
    extraData: string;
    messageId: string;
  }) {
    let orderId = '';
    try {
      const data = JSON.parse(extraData) as Record<string, string>;
      orderId = data[MezonFormKey.SELECT.DEPT_USER];
    } catch (error) {
      this.logger.error(
        `Failed to parse extra_data for message ${messageId}: ${error}`,
      );
      throw error;
    }
    if (!orderId) {
      this.logger.warn(
        `No orderId found in extra_data for message ${messageId}`,
      );
      throw new NotFoundException('Order ID not found in message extra data');
    }
    return orderId;
  }
}
