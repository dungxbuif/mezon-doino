import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import BillingMessageEntity from '@src/common/database/bill-message.entity';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class BillingMessageService {
  constructor(
    @InjectRepository(BillingMessageEntity)
    private billingMessageRepo: Repository<BillingMessageEntity>,
  ) {}
  async getList(options: FindManyOptions<BillingMessageEntity>) {
    return this.billingMessageRepo.find(options);
  }

  async create(data: Partial<BillingMessageEntity>) {
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
      | FindOptionsWhere<BillingMessageEntity>,
    updateData: Partial<BillingMessageEntity>,
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
      | FindOptionsWhere<BillingMessageEntity>,
  ) {
    await this.billingMessageRepo.delete(criteria);
  }
}
