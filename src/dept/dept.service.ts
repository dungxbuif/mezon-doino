import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import BillEntity from '@src/common/database/bill.entity';
import OrderEntity from '@src/common/database/order.entity';
import { OrderStatus } from '@src/common/enums';
import { In, Repository } from 'typeorm';

@Injectable()
export class DeptService {
  constructor(
    @InjectRepository(BillEntity)
    private billRepo: Repository<BillEntity>,
  ) {}
  async getListDeptByOwner(ownerId: string): Promise<OrderEntity[]> {
    const bills = await this.billRepo.find({
      where: {
        ownerId,
        orders: { status: In([OrderStatus.NEW, OrderStatus.CANCELED]) },
      },
      relations: {
        orders: true,
      },
    });

    return bills.flatMap((bill) => bill.orders);
  }
}
