import { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';

export default class BillingButton {
  static confirmKey = 'confirm_pay';
  static cancelKey = 'cancel_pay';
  static notConfirmKey = 'not_confirm_pay';

  static isConfirm(message: MessageButtonClicked) {
    return message.button_id.startsWith(BillingButton.confirmKey + '_');
  }
  static isCancel(message: MessageButtonClicked) {
    return message.button_id.startsWith(BillingButton.cancelKey + '_');
  }
  static isNotConfirm(message: MessageButtonClicked) {
    return message.button_id.startsWith(BillingButton.notConfirmKey + '_');
  }
}
