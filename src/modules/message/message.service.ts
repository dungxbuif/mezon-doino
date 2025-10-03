import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import MessageEntity from '@src/common/database/message.entity';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private billingMessageRepo: Repository<MessageEntity>,
  ) {}
  async getList(options: FindManyOptions<MessageEntity>) {
    return this.billingMessageRepo.find(options);
  }

  async create(data: Partial<MessageEntity>) {
    const billingMessage = this.billingMessageRepo.create(data);
    return this.billingMessageRepo.save(billingMessage);
  }

  async update(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | FindOptionsWhere<MessageEntity>,
    updateData: Partial<MessageEntity>,
  ) {
    await this.billingMessageRepo.update(criteria, updateData);
  }
  async delete(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | FindOptionsWhere<MessageEntity>,
  ) {
    await this.billingMessageRepo.delete(criteria);
  }
}
