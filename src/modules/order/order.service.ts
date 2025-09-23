import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import OrderEntity from '@src/common/database/order.entity';
import { withinVnDayTypeOrmQuery } from '@src/common/utils/time.util';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private orderRepo: Repository<OrderEntity>,
  ) {}

  async findOne(options: FindOneOptions<OrderEntity>) {
    return this.orderRepo.findOne(options);
  }

  async create(orderData: Partial<OrderEntity>) {
    return this.orderRepo.save(this.orderRepo.create(orderData));
  }

  async update(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | FindOptionsWhere<OrderEntity>,
    updateData: Partial<OrderEntity>,
  ) {
    await this.orderRepo.update(criteria, updateData);
  }

  async getTodayOrdersByChannel(channelId: string) {
    return this.orderRepo.find({
      where: {
        channelId,
        createdAt: withinVnDayTypeOrmQuery(),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async delete(options: FindOptionsWhere<OrderEntity>) {
    await this.orderRepo.delete(options);
  }

  async getLatestUserOrderInChannel(senderId: string) {
    return this.orderRepo.findOne({
      where: { senderId, createdAt: withinVnDayTypeOrmQuery() },
      order: { createdAt: 'DESC' },
    });
  }

  async getOrdersByBillId(billId: number) {
    return this.orderRepo.find({
      where: { billId },
      order: { createdAt: 'DESC' },
    });
  }
}
