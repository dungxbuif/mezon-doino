import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { AppEventEnum } from '@src/common/constants';
import { UserEntity } from '@src/user/user.entity';
import { isEmpty } from 'lodash';
import { In, Repository } from 'typeorm';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  private async create(user: Partial<UserEntity>) {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  async getUserByClanData(payload: {
    id?: string;
    username?: string;
    clan?: { clan_id: string; clan_nick: string };
  }) {
    const { id, username, clan } = payload;
    if (!id && !username && isEmpty(clan)) {
      this.logger.warn(
        'getUserByClanData called without id, username or clan data',
      );
      return null;
    }
    const query = {};
    if (id) {
      Object.assign(query, { id });
    }
    if (username) {
      Object.assign(query, { username });
    }
    if (clan) {
      Object.assign(query, {
        clanMetaData: `clanMetaData @> '[{"clan_id": "${clan.clan_id}"}]'`,
      });
    }
    return this.userRepository.findOneBy(query);
  }

  async getManyByIdsAndUsernames({
    ids,
    usernames,
  }: {
    ids?: string[];
    usernames?: string[];
  }) {
    const orConditions: Array<import('typeorm').FindOptionsWhere<UserEntity>> =
      [];
    if (ids?.length) {
      orConditions.push({ id: In(ids) });
    }
    if (usernames?.length) {
      orConditions.push({ username: In(usernames) });
    }
    if (orConditions.length === 0) {
      return [];
    }
    return this.userRepository.find({ where: orConditions });
  }

  @OnEvent(AppEventEnum.CREATE_USER)
  async handleUserCreatedEvent(payload: { id: string } & Partial<UserEntity>) {
    const existingUser = await this.userRepository.findOneBy({
      id: payload.id,
    });
    if (existingUser) {
      if (payload?.clanMetaData?.length) {
        existingUser.clanMetaData = [
          ...existingUser.clanMetaData,
          ...payload.clanMetaData.filter(
            (cm) =>
              !existingUser.clanMetaData?.some(
                (em) => em.clan_id === cm.clan_id,
              ),
          ),
        ];
        await this.userRepository.save(existingUser);
      }
      return;
    }
    await this.create(payload);
  }
}
