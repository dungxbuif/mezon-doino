export enum AppEventEnum {
  ORDER_CREATED = 'order.created',
  ORDER_CANCELED = 'order.canceled',

  ORDER_STATUS_UPDATED = 'order.status_updated',

  ORDER_CLICKED_CONFIRM = 'order.clicked_confirm',
  ORDER_CLICKED_CANCEL = 'order.clicked_cancel',
  ORDER_CLICKED_NOT_CONFIRM = 'order.clicked_not_confirm',

  BILL_CREATED = 'bill.created',
  BILL_ADD_ORDER = 'bill.add_order',

  DEPT_LISTED = 'dept.listed',
  DEPT_SCHEDULED = 'dept.scheduled',
  DEPT_REMINDER_LIST = 'dept.reminder.list',
  DEPT_REMINDER_CANCEL = 'dept.reminder.cancel',

  CREATE_USER = 'user.create',
}
