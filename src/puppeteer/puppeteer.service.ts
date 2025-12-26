import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';

puppeteer.use(StealthPlugin());

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PuppeteerService.name);
    private browser: Browser | null = null;
    private page: Page | null = null;

    async onModuleInit(): Promise<void> {
        this.logger.log('Launching Puppeteer...');
        await this.launchBrowser();
    }

    private async launchBrowser(): Promise<void> {
        this.browser = await puppeteer.launch({
            headless: false,
            userDataDir: './puppeteer-profile',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        this.page = await this.browser.newPage();

        await this.page.setViewport({ 
            width: 1920, 
            height: 1080
        });
        
        await this.page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        this.page.setDefaultTimeout(30000);
        this.logger.log('Puppeteer launched successfully');
    }

    getPage(): Page {
        if (!this.page) {
            throw new Error('Puppeteer page is not initialized');
        }
        return this.page;
    }

    async onModuleDestroy(): Promise<void> {
        this.logger.log('Closing Puppeteer...');
        if (this.browser) {
            await this.browser.close();
        }
    }
}