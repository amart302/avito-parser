import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';

@Module({
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService]
})
export class MessagesModule {}
