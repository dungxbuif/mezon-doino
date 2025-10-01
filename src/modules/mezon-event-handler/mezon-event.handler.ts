/* eslint-disable @typescript-eslint/unbound-method */
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEventEnum } from '@src/common/constants';
import BillingButton from '@src/common/mezon-command/billing-button.command';
import DeptCommand from '@src/common/mezon-command/dept.command';
import { OrderCommand } from '@src/common/mezon-command/order.command';
import { MezonClientService } from '@src/common/shared/services/mezon.service';
import { replyMessageGenerate } from '@src/common/utils/generateReplyMessage';
import { ChannelMessage, MezonClient } from 'mezon-sdk';
import { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';

@Injectable()
export class BotHandler {
  constructor(
    @Inject('MEZON_CLIENT') private botClient: MezonClient,
    private emitter: EventEmitter2,
    private mezonService: MezonClientService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-misused-promises
    this.botClient.onChannelMessage(this.handleMessage.bind(this));
    this.botClient.onMessageButtonClicked(this.handleButtonClicked.bind(this));
  }
  private verifyAndDeliveryNewOrderEvent(message: ChannelMessage) {
    if (OrderCommand.isNewOrder(message.content.t)) {
      this.emitter.emit(AppEventEnum.ORDER_CREATED, message);
    }
  }

  private verifyAndDeliveryCancelOrderEvent(message: ChannelMessage) {
    if (OrderCommand.isCancel(message.content.t)) {
      this.emitter.emit(AppEventEnum.ORDER_CANCELED, message);
    }
  }

  private handleAndDeliveryConfirmBillEvent(message: ChannelMessage) {
    if (OrderCommand.isConfirmBill(message.content.t)) {
      this.emitter.emit(AppEventEnum.BILL_CREATED, message);
    }
  }

  private handleAndDeliveryAddOrderEvent(message: ChannelMessage) {
    if (OrderCommand.addOrder(message.content.t)) {
      this.emitter.emit(AppEventEnum.BILL_ADD_ORDER, message);
    }
  }

  private async deliveryDeptListEvent(message: ChannelMessage) {
    if (DeptCommand.isDeptList(message.content.t)) {
      this.emitter.emit(AppEventEnum.DEPT_LISTED, message);
    }
  }

  private async deliveryBillingButtonClick(message: MessageButtonClicked) {
    if (BillingButton.isBillingButton(message)) {
      this.emitter.emit(AppEventEnum.BILLING_BUTTON_CLICKED, message);
    }
  }

  private async deliveryScheduledDeptEvent(message: ChannelMessage) {
    if (DeptCommand.isValidCommandQuickCheck(message)) {
      this.emitter.emit(AppEventEnum.DEPT_SCHEDULED, message);
    }
  }

  private async helpCommandEvent(message: ChannelMessage) {
    const content = message.content.t;
    if (
      content === '*doino' ||
      content === '*doino help' ||
      content === '*doino h' ||
      content === '*doino -h'
    ) {
      const content =
        'Hướng dẫn sử dụng bot *doino:\n' +
        '*order <nội dung>: Ghi nợ tương tự bot order\n' +
        '*order cancel: Hủy đơn đã đặt gần nhất trong ngày và xóa khỏi bill\n' +
        '*report order: Chốt order và tạo bill\n' +
        '*themdon: Sau khi chốt đơn, thêm đơn vào bill trước đó\n' +
        '*listno: Liệt kê danh sách ghi nợ (Không phân biệt clan và channel)\n' +
        '*doino all <repeat>: Nhắc nhở tất cả mọi người đang nợ theo tần suất lặp lại\n' +
        '*doino @user1 @user2 <repeat>: Nhắc nhở những người được tag theo tần suất lặp lại (hỗ trợ mention và username)\n' +
        '! Note: <repeat> là tần suất nhắc nhở. Hỗ trợ phút(m), giờ(h), ngày(d)\n' +
        'Ví dụ: *doino user.name 2h\n' +
        '*doino list: Liệt kê các nhắc nhở đang hoạt động\n' +
        '*doino cancel <id> | all: Hủy nhắc nhở theo jobId trong lệnh *doino list\n' +
        '*doino confirm: Bot nhắn tin list nợ qua DM để confirm\n';

      const messageToSend = replyMessageGenerate(
        {
          messageContent: content,
          mk: [{ type: 'pre', s: 0, e: content.length + 6 }],
        },
        message,
      );
      await this.mezonService.sendMessage(messageToSend);
    }
  }
  private deliverListDeptReminderEvent(message: ChannelMessage) {
    if (DeptCommand.isListDeptReminder(message.content.t)) {
      this.emitter.emit(AppEventEnum.DEPT_REMINDER_LIST, message);
    }
  }

  private deliverCancelDeptReminderEvent(message: ChannelMessage) {
    if (DeptCommand.isCancelReminderCommand(message.content.t)) {
      this.emitter.emit(AppEventEnum.DEPT_REMINDER_CANCEL, message);
    }
  }

  private async handleMessage(message: ChannelMessage): Promise<void> {
    this.emitter.emit(AppEventEnum.CREATE_USER, {
      id: message.sender_id,
      username: message.username,
      clanMetaData: [
        { clan_id: message.clan_id, clan_nick: message.clan_nick },
      ],
    });
    // const channelId = message.channel_id;
    // if (channelId !== '1841290471456903168') {
    //   return;
    // }
    [
      this.verifyAndDeliveryNewOrderEvent,
      this.verifyAndDeliveryCancelOrderEvent,
      this.handleAndDeliveryConfirmBillEvent,
      this.handleAndDeliveryAddOrderEvent,
      this.deliveryDeptListEvent,
      this.deliveryScheduledDeptEvent,
      this.helpCommandEvent,
      this.deliverListDeptReminderEvent,
      this.deliverCancelDeptReminderEvent,
    ].forEach((cb) => {
      cb.call(this, message);
    });
  }

  private async handleButtonClicked(event: MessageButtonClicked) {
    console.log('Button clicked event received:', event);
    [this.deliveryBillingButtonClick].forEach((cb) => {
      cb.call(this, event);
    });
  }
}
