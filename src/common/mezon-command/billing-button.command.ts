import { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';

export default class BillingButton {
  static confirmKey = 'confirm_pay';
  static cancelKey = 'cancel_pay';
  static notConfirmKey = 'not_confirm_pay';

  static isBillingButton(event: MessageButtonClicked) {
    return [
      BillingButton.confirmKey,
      BillingButton.cancelKey,
      BillingButton.notConfirmKey,
    ].includes(event.button_id);
  }
}
