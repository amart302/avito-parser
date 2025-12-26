import { Injectable } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { IMessage } from './interfaces/message.interface';

@Injectable()
export class MessagesService {
    constructor(
        private readonly messagesGateway: MessagesGateway
    ) {}

    emit(message: IMessage) {
        this.messagesGateway.emitMessage(message);
    }
}
