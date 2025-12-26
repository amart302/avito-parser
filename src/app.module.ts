import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { AvitoModule } from './avito/avito.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PuppeteerModule,
    AvitoModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env"
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
