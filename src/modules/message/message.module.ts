import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import MessageEntity from '@src/common/database/message.entity';
import { MessageService } from '@src/modules/message/message.service';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity])],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
