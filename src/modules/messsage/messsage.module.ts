import { Module } from '@nestjs/common';
import { MesssageService } from './messsage.service';

@Module({
  providers: [MesssageService],
})
export class MesssageModule {}
