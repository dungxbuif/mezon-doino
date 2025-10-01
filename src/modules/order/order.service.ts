import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import OrderEntity from '@src/common/database/order.entity';
import { OrderStatus } from '@src/common/enums';
import { withinVnDayTypeOrmQuery } from '@src/common/utils/time.util';
import { FindOneOptions, FindOptionsWhere, IsNull, Repository } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private orderRepo: Repository<OrderEntity>,
  ) {}

  async findOne(options: FindOneOptions<OrderEntity>) {
    return this.orderRepo.findOne(options);
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

  async getNewOrdersByChannel(channelId: string) {
    return this.orderRepo.findBy({
      channelId,
      status: OrderStatus.NEW,
      billId: IsNull(),
      createdAt: withinVnDayTypeOrmQuery(),
    });
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

  async delete(options: FindOptionsWhere<OrderEntity>) {
    await this.orderRepo.delete(options);
  }
}
