import MessageEntity from '@src/common/database/message.entity';

export const orderComfirmDirectMessageQuery = (ownerId: string) => ({
  ownerId,
  type: 'dm' as const,
});

export const channelBillConfirmMessageQuery = (billId: number) => ({
  billId,
  type: 'reply' as const,
});

export const isChannelBillConfirmMessage = (message: MessageEntity) =>
  message.type === 'reply' && message?.billId;
export const isOrderComfirmDirectMessage = (message: MessageEntity) =>
  message.type === 'dm';
