import { Module } from '@nestjs/common';
import { MessageService } from '@src/modules/message/message.service';

@Module({
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
