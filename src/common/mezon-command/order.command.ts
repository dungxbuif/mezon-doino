const commandKey = 'order';
const commandPrefix = `*`;
const command = `${commandPrefix}${commandKey}`;

export class OrderCommand {
  static helpContent =
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
