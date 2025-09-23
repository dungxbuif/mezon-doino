import { AbstractAuditEntity } from '@src/common/database/abstract.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

class UserClanMetaData {
  clan_nick: string;
  clan_id: string;
}

@Entity('users')
export class UserEntity extends AbstractAuditEntity {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true, type: 'jsonb' })
  clanMetaData: UserClanMetaData[];
}
