/* eslint-disable no-useless-catch */
/* eslint-disable sonarjs/no-useless-catch */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Inject, Injectable } from '@nestjs/common';
import {
  ReactMessageChannel,
  ReplyMezonMessage,
} from '@src/common/dtos/replyMessage.dto';
import { ApiMessageMention, MezonClient } from 'mezon-sdk';

@Injectable()
export class MezonClientService {
  constructor(@Inject('MEZON_CLIENT') private client: MezonClient) {}

  getClient() {
    return this.client;
  }

  async sendMessage(replyMessage: ReplyMezonMessage) {
    try {
      const channel = await this.client.channels.fetch(replyMessage.channel_id);
      if (replyMessage?.ref?.length && replyMessage?.message_id) {
        const message = await channel.messages.fetch(replyMessage.message_id);
        return await message.reply(
          replyMessage.msg,
          replyMessage.mentions,
          replyMessage.attachments,
          replyMessage.mention_everyone,
          replyMessage.anonymous_message,
          replyMessage.topic_id,
          replyMessage.code,
        );
      }
      return await channel.send(
        replyMessage.msg,
        replyMessage.mentions,
        replyMessage.attachments,
        replyMessage.mention_everyone,
        replyMessage.anonymous_message,
        replyMessage.topic_id,
        replyMessage.code,
      );
    } catch (error) {
      throw error;
    }
  }

  async sendMessageToChannel(
    channelId: string,
    message,
    mentions: ApiMessageMention[],
  ) {
    try {
      const channel = await this.client.channels.fetch(channelId);
      return await channel.send(message, mentions);
    } catch (error) {
      throw error;
    }
  }

  async sendMessageToUser(messageToUser: ReplyMezonMessage) {
    const dmClan = await this.client.clans.fetch('0');
    const user = await dmClan.users.fetch(messageToUser.userId);
    try {
      return await user.sendDM({
        t: messageToUser.textContent,
        ...messageToUser.messOptions,
      });
    } catch (error) {
      throw error;
    }
  }

  async createDMchannel(userId: string) {
    try {
      return await this.client.createDMchannel(userId);
    } catch (error) {
      console.log('createDMchannel', error);
    }
  }

  async reactMessageChannel(dataReact: ReactMessageChannel) {
    const channel = await this.client.channels.fetch(dataReact.channel_id);
    const message = await channel.messages.fetch(dataReact.message_id);
    const dataSend = {
      emoji_id: dataReact.emoji_id,
      emoji: dataReact.emoji,
      count: dataReact.count,
    };
    try {
      return await message.react(dataSend);
    } catch (error) {
      console.log('reactMessageChannel', error);
      return null;
    }
  }

  async getMessageById(channelId: string, messageId: string) {
    const channel = await this.client.channels.fetch(channelId);
    try {
      return await channel.messages.fetch(messageId);
    } catch (error) {
      console.log('getMessageById', error);
      return null;
    }
  }
  async deleteMessage(channelId: string, messageId: string) {
    try {
      const message = await this.getMessageById(channelId, messageId);
      if (!message) {
        return null;
      }
      return await message.delete();
    } catch (error) {
      console.log('deleteMessage', error);
      return null;
    }
  }
}
