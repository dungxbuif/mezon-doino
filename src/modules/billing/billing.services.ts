import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import BillEntity from '@src/common/database/bill.entity';
import { withinVnDayTypeOrmQuery } from '@src/common/utils/time.util';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(BillEntity)
    private billRepo: Repository<BillEntity>,
  ) {}

  async getOne(options: FindOptionsWhere<BillEntity>) {
    return this.billRepo.findOne({ where: options });
  }

  async getMany(options: FindManyOptions<BillEntity>) {
    return this.billRepo.find(options);
  }

  async getLatestBillByChannel(channelId: string) {
    return this.billRepo.findOne({
      where: {
        channelId,
        createdAt: withinVnDayTypeOrmQuery(),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getLatestBillWithOrdersByChannel(channelId: string) {
    return this.billRepo.findOne({
      where: {
        channelId,
        createdAt: withinVnDayTypeOrmQuery(),
      },
      relations: ['orders'],
      order: { createdAt: 'DESC' },
    });
  }

  getQueryBuilder() {
    return this.billRepo.createQueryBuilder('bill');
  }

  async create(billData: Partial<BillEntity>) {
    return this.billRepo.save(this.billRepo.create(billData));
  }

  async update(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | FindOptionsWhere<BillEntity>,
    updateData: Partial<BillEntity>,
  ) {
    await this.billRepo.update(criteria, updateData);
  }
}
