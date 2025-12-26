import { Module } from '@nestjs/common';
import { AvitoService } from './avito.service';
import { PuppeteerModule } from 'src/puppeteer/puppeteer.module';

@Module({
    imports: [PuppeteerModule],
    providers: [AvitoService],
    exports: [AvitoService]
})
export class AvitoModule {}
