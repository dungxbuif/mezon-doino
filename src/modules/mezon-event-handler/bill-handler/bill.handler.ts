/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEventEnum } from '@src/common/constants';
import BillEntity from '@src/common/database/bill.entity';
import OrderEntity from '@src/common/database/order.entity';
import { OrderStatus } from '@src/common/enums';
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
    const channelId = message.channel_id;
    const latestBill = await this.billService.getLatestBillByChannel(channelId);
    if (!latestBill) {
      this.logger.log(
        `No existing bill found for channel ${channelId} today. Cannot add order to bill.`,
      );
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
    this.logger.log(
      `Added order ${message.message_id} to latest bill ${latestBill.id} for channel ${channelId}`,
    );
  }

  @OnEvent(AppEventEnum.ORDER_CLICKED_CONFIRM)
  @OnEvent(AppEventEnum.ORDER_CLICKED_CANCEL)
  @OnEvent(AppEventEnum.ORDER_CLICKED_NOT_CONFIRM)
  async confirmOrder(message: MessageButtonClicked) {
    let newStatus = OrderStatus.NEW;
    const isConfirm = BillingButton.isConfirm(message);
    const isCancel = BillingButton.isCancel(message);
    if (isConfirm) {
      newStatus = OrderStatus.CONFIRMED;
    }
    if (isCancel) {
      newStatus = OrderStatus.CANCELED;
    }
    const orderId = message.button_id
      .replace(`${BillingButton.notConfirmKey}_`, '')
      .replace(`${BillingButton.confirmKey}_`, '')
      .replace(`${BillingButton.cancelKey}_`, '');
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
      const components: any = [];
      orders.forEach((ord) => {
        const com = [
          {
            type: EMessageComponentType.BUTTON,
            id: `${BillingButton.confirmKey}_${ord.id}`,
            component: {
              label: `${ord.senderName} (PAID)`,
              style: EButtonMessageStyle.SUCCESS,
            },
          },
          {
            type: EMessageComponentType.BUTTON,
            id: `${BillingButton.cancelKey}_${ord.id}`,
            component: {
              label: `${ord.senderName} (CANCELED)`,
              style: EButtonMessageStyle.DANGER,
            },
          },
          {
            type: EMessageComponentType.BUTTON,
            id: `${BillingButton.notConfirmKey}_${ord.id}`,
            component: {
              label: `${ord.senderName} (CHƯA XÁC NHẬN)`,
              style: EButtonMessageStyle.SECONDARY,
            },
          },
        ];

        components.push({
          components: com,
        });
      });
      const blockCode = '```';
      const isPaid = (status: OrderStatus) => status === OrderStatus.CONFIRMED;
      const isCanceled = (status: OrderStatus) =>
        status === OrderStatus.CANCELED;

      const embed = [
        {
          color,
          title: `${title}`,
          description:
            `(✅: Xác nhận đã thanh toán, ❌: Hủy đơn)` +
            `${blockCode}${orders
              .map(
                (ord, index) =>
                  `${index + 1}. ${ord.senderName}: order [${ord.content.toUpperCase()}] ` +
                  `${isPaid(ord.status) ? '✅' : ''} ${isCanceled(ord.status) ? '❌' : ''}`,
              )
              .join(
                '\n',
              )}${blockCode}\n${'(Chọn số để xác nhận thanh toán: Xanh - Đã thanh toán, Đỏ - Hủy)'}`,
        },
      ];
      return {
        components,
        embed,
      };
    }
  }
}
