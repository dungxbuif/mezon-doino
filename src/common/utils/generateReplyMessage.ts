import { ReplyMezonMessage } from '@src/common/dtos/replyMessage.dto';
import { ApiMessageRef, ChannelMessage } from 'mezon-sdk';

export function fieldGenerate(
  field: string,
  replayConent,
  message: ChannelMessage,
  defaultValue: Record<string, any>,
) {
  return field in replayConent
    ? replayConent[field]
    : field in defaultValue
      ? defaultValue[field]
      : message[field];
}

export function refGenerate(msg: ChannelMessage): ApiMessageRef[] {
  return [
    {
      message_id: '',
      message_ref_id: msg.message_id as string,
      ref_type: 0,
      message_sender_id: msg.sender_id,
      message_sender_username: msg.username,
      mesages_sender_avatar: msg.avatar,
      message_sender_clan_nick: msg.clan_nick,
      message_sender_display_name: msg.display_name,
      content: JSON.stringify(msg.content),
      has_attachment: Boolean(msg?.attachments?.length) || false,
    },
  ];
}

export function replyMessageGenerate(
  replayConent: Record<string, any>,
  message: ChannelMessage,
  hasRef = true,
  newRef?: ApiMessageRef[],
): ReplyMezonMessage {
  const replayMessage: ReplyMezonMessage = {} as ReplyMezonMessage;
  const defaultValue = {
    mentions: [],
    attachments: [],
  };
  [
    'clan_id',
    'channel_id',
    'mode',
    'is_public',
    'topic_id',
    'message_id',
    ...Object.keys(defaultValue),
  ].forEach(
    (field) =>
      (replayMessage[field] = fieldGenerate(
        field,
        replayConent,
        message,
        defaultValue,
      )),
  );

  const messageContent = {
    t: 'messageContent' in replayConent ? replayConent.messageContent : '',
  };

  // option for bot's message
  [
    'lk',
    'hg',
    'mk',
    'ej',
    'vk',
    'contentThread',
    'embed',
    'components',
  ].forEach((key) => {
    if (key in replayConent) {
      messageContent[key] = replayConent[key];
    }
  });

  replayMessage.msg = { ...messageContent };

  replayMessage.ref = hasRef
    ? newRef?.length
      ? newRef
      : refGenerate(message)
    : [];

  return replayMessage;
}
