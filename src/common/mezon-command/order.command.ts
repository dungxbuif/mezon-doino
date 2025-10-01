const commandKey = 'order';
const commandPrefix = `*`;
const command = `${commandPrefix}${commandKey}`;

export class OrderCommand {
  static isCancel(message = ''): boolean {
    return message?.trim() === `${command} cancel`;
  }

  static isNewOrder(message = ''): boolean {
    return !this.isCancel(message) && message?.trim().startsWith(command + ' ');
  }

  static isConfirmBill(message = ''): boolean {
    return message?.trim() === '*report order';
  }

  static addOrder(message = ''): boolean {
    return message?.trim() === '*themdon';
  }

  static extractOrderContent(content = ''): string {
    return content.replace(`${command} `, '').trim();
  }
}
