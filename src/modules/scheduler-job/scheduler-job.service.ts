/* eslint-disable no-await-in-loop */
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { MezonClientService } from '@src/common/shared/services/mezon.service';
import { sleep } from '@src/common/utils';
import { vnLocalDateTime } from '@src/common/utils/time.util';
import SchedulerJobEntity from '@src/modules/scheduler-job/scheduler-job.entity';
import ms from 'ms';
import { In, LessThanOrEqual, Repository } from 'typeorm';

interface UserWarning {
  channelId: string;
  content: string;
  createdAt?: Date;
  senderId: string;
  senderName: string;
}

@Injectable()
export class SchedulerJobService {
  constructor(
    @InjectRepository(SchedulerJobEntity)
    private readonly schedulerJobRepository: Repository<SchedulerJobEntity>,
    private mezonService: MezonClientService,
  ) {}

  async getJobById(id: number): Promise<SchedulerJobEntity | null> {
    return this.schedulerJobRepository.findOneBy({ id });
  }

  async getJobsByOrderIds(orderIds: string[]): Promise<SchedulerJobEntity[]> {
    return this.schedulerJobRepository.find({
      where: { orderId: In(orderIds) },
    });
  }

  async createJobs(jobs: Array<Partial<SchedulerJobEntity>>): Promise<void> {
    await this.schedulerJobRepository.save(
      this.schedulerJobRepository.create(jobs),
    );
  }

  async deleteJobById(id: number): Promise<void> {
    await this.schedulerJobRepository.delete({ id });
  }

  calTimeByRepeat(repeat: string, date = new Date()): Date {
    const number = parseInt(repeat.slice(0, -1), 10) || 1;
    const unit = repeat.slice(-1);
    return new Date(date.getTime() + ms(`${number}${unit}`));
  }

  async pingUserWarning(deptOrders: UserWarning[]) {
    for (const {
      channelId,
      content,
      createdAt,
      senderId,
      senderName,
    } of deptOrders) {
      const message = {
        t:
          `Con vợ ${senderName} trả nợ order: ${content.toLocaleUpperCase()} ` +
          (createdAt ? ' - lúc ' + vnLocalDateTime(createdAt) : '') +
          ' đê !!!',
      };
      const mentions = [{ user_id: senderId, s: 7, e: senderName.length + 7 }];
      await this.mezonService.sendMessageToChannel(
        channelId,
        message,
        mentions,
      );
      await sleep(500);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const allJobs = await this.schedulerJobRepository.find({
      where: { nextTime: LessThanOrEqual(new Date()) },
    });
    console.log('Run cron job, found: ', allJobs);
    const notiData: UserWarning[] = [];
    const newCron = allJobs.map((order) => {
      const { channelId, content, userId, senderName, repeat, nextTime } =
        order;
      const newNextTime = this.calTimeByRepeat(repeat, nextTime);
      order.nextTime = newNextTime;
      notiData.push({
        channelId,
        content,
        senderId: userId,
        senderName,
      });
      return order;
    });
    console.log('Next cron jobs: ', newCron);
    await this.schedulerJobRepository.save(newCron);
    await this.pingUserWarning(notiData);
  }
}
