import OrderEntity from '@src/common/database/order.entity';
import { MezonFormKey, OrderStatus } from '@src/common/enums';
import BillingButton from '@src/common/mezon-command/billing-button.command';
import { getRandomColor } from '@src/common/utils';
import { vnLocalDateTime } from '@src/common/utils/time.util';
import {
  EButtonMessageStyle,
  EMessageComponentType,
  IInteractiveMessageProps,
  IMessageActionRow,
} from 'mezon-sdk';

export class OrderFormHelper {
  static generateOrderFormlMessage(orders: OrderEntity[]) {
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
              id: BillingButton.cancelKey,
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
          label: `${ord.senderName}: order [${ord.content.toUpperCase()}] lúc ${vnLocalDateTime(ord.createdAt)}`,
          value: ord.id,
        });
        ordersList.push(
          `${index + 1}. ${ord.senderName}: order [${ord.content.toUpperCase()}] lúc ${vnLocalDateTime(ord.createdAt)}` +
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
