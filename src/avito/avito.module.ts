import { Module } from '@nestjs/common';
import { AvitoService } from './avito.service';
import { PuppeteerModule } from 'src/puppeteer/puppeteer.module';
import { MessagesModule } from 'src/messages/messages.module';

@Module({
    imports: [PuppeteerModule, MessagesModule],
    providers: [AvitoService],
    exports: [AvitoService]
})
export class AvitoModule {}
