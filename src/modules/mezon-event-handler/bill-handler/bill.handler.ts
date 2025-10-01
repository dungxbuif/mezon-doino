/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEventEnum } from '@src/common/constants';
import BillEntity from '@src/common/database/bill.entity';
import OrderEntity from '@src/common/database/order.entity';
import { MezonFormKey, OrderStatus } from '@src/common/enums';
import BillingButton from '@src/common/mezon-command/billing-button.command';
import { MezonClientService } from '@src/common/shared/services/mezon.service';
import { getRandomColor } from '@src/common/utils';
import { replyMessageGenerate } from '@src/common/utils/generateReplyMessage';
import { withinVnDayTypeOrmQuery } from '@src/common/utils/time.util';
import { BillService } from '@src/modules/bill/bill.services';
import { BillingMessageService } from '@src/modules/bill/billing-message.service';
import { OrderService } from '@src/modules/order/order.service';
import {
  ChannelMessage,
  EButtonMessageStyle,
  EMessageComponentType,
  IInteractiveMessageProps,
  IMessageActionRow,
} from 'mezon-sdk';
import { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';
import { In, IsNull } from 'typeorm';

@Injectable()
export class BillCommandHandler {
  private readonly logger = new Logger(BillCommandHandler.name);
  constructor(
    private orderService: OrderService,
    private billService: BillService,
    private billingMessageService: BillingMessageService,
    private mezonService: MezonClientService,
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

    let latestBill = await this.billService.getLatestBillByChannel(channelId);

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
      latestBill = await this.billService.create({
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
      await this.createReplyBillMessage({
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
      latestBill.ownerId = ownerId;
      await this.billService.update(latestBill.id, {
        ownerId,
      });
      finalOrders = todayOrders.filter(
        (order) => order.billId === latestBill?.id,
      );
      await this.createReplyBillMessage({
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
    const latestBill = await this.billService.getLatestBillByChannel(channelId);
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
    let newStatus = OrderStatus.NEW;
    const buttonId = message.button_id;
    const isConfirm = BillingButton.confirmKey === buttonId;
    const isCancel = BillingButton.cancelKey === buttonId;
    if (isConfirm) {
      newStatus = OrderStatus.CONFIRMED;
    }
    if (isCancel) {
      newStatus = OrderStatus.CANCELED;
    }
    let orderId = '';
    try {
      const data = JSON.parse(message.extra_data) as Record<string, string>;
      orderId = data[MezonFormKey.SELECT.DEPT_USER];
    } catch (error) {
      this.logger.error(
        `Failed to parse extra_data for message ${message.message_id}: ${error}`,
      );
      return;
    }
    if (!orderId) {
      this.logger.warn(
        `No orderId found in extra_data for message ${message.message_id}`,
      );
      return;
    }
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
      return;
    }
    const orders = await this.orderService.getOrdersByBillId(order.billId);
    const billMessages = await this.billingMessageService.getList({
      where: { billId: order.billId },
    });
    const newContent = this.generateBillMessage(orders || []);
    const mezonMessages = await Promise.all(
      billMessages.map(async (billMsg) =>
        this.mezonService.getMessageById(order.channelId, billMsg.messageId),
      ),
    );
    await Promise.all(
      mezonMessages.map(async (mezonMsg) => mezonMsg?.update(newContent)),
    );
  }

  private async createReplyBillMessage({
    bill,
    message,
    orders,
    channelId,
    ownerId,
  }: {
    bill: BillEntity;
    message: ChannelMessage;
    orders: OrderEntity[];
    channelId: string;
    ownerId: string;
  }) {
    await this.deletePreviousBillMessages({ bill, channelId });
    const embedMessage = this.generateBillMessage(orders);
    const billMessage = replyMessageGenerate(embedMessage, message);
    const createdBillMessage = await this.mezonService.sendMessage(billMessage);
    await this.billingMessageService.create({
      billId: bill.id,
      messageId: createdBillMessage.message_id,
      ownerId,
    });
    this.logger.log(
      `Bill created/updated successfully for channel ${channelId} by owner ${ownerId}`,
    );
  }

  private async deletePreviousBillMessages({
    bill,
    channelId,
  }: {
    bill: BillEntity;
    channelId: string;
  }) {
    const oldMessage = await this.billingMessageService.getList({
      where: { billId: bill.id, type: 'reply' },
    });
    await Promise.all([
      ...oldMessage.map(async (msg) =>
        this.mezonService.deleteMessage(channelId, msg.messageId),
      ),
      this.billingMessageService.delete({
        billId: bill.id,
        type: 'reply',
      }),
    ]);
  }

  private generateBillMessage(orders: OrderEntity[]) {
    {
      const color = getRandomColor();
      const title = 'HÓA ĐƠN GHI NỢ';
      const components: IMessageActionRow[] = [
        {
          components: [
            {
              type: EMessageComponentType.BUTTON,
              id: BillingButton.confirmKey,
              component: {
                label: 'ĐÃ THANH TOÁN',
                style: EButtonMessageStyle.SUCCESS,
              },
            },
            {
              type: EMessageComponentType.BUTTON,
              id: 'BillingButton.cancelKey',
              component: {
                label: 'HỦY ĐƠN',
                style: EButtonMessageStyle.DANGER,
              },
            },
            {
              type: EMessageComponentType.BUTTON,
              id: `${BillingButton.notConfirmKey}`,
              component: {
                label: 'CHƯA XÁC NHẬN',
                style: EButtonMessageStyle.SECONDARY,
              },
            },
          ],
        },
      ];

      const blockCode = '```';
      const isPaid = (status: OrderStatus) => status === OrderStatus.CONFIRMED;
      const isCanceled = (status: OrderStatus) =>
        status === OrderStatus.CANCELED;
      const ordersList: string[] = [];
      const orderOptions: Array<{
        label: string;
        value: string;
      }> = [];
      orders.forEach((ord, index) => {
        orderOptions.push({
          label: `${ord.senderName}: order [${ord.content.toUpperCase()}]`,
          value: ord.id,
        });
        ordersList.push(
          `${index + 1}. ${ord.senderName}: order [${ord.content.toUpperCase()}] ` +
            `${isPaid(ord.status) ? '✅' : ''} ${isCanceled(ord.status) ? '❌' : ''}`,
        );
      });
      const embed: IInteractiveMessageProps[] = [
        {
          color,
          title: `${title}`,
          description:
            `(✅: Xác nhận đã thanh toán, ❌: Hủy đơn)` +
            `${blockCode}${ordersList.join('\n')}${blockCode}`,
          fields: [
            {
              name: '',
              value: `Chọn order muốn cập nhật:`,
              inputs: {
                id: MezonFormKey.SELECT.DEPT_USER,
                type: EMessageComponentType.SELECT,
                component: {
                  options: orderOptions,
                },
              },
            },
          ],
          footer: {
            text: '(Chọn số để xác nhận thanh toán: Xanh - Đã thanh toán, Đỏ - Hủy)',
          },
        },
      ];
      return {
        components,
        embed,
      };
    }
  }
}
