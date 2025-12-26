import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Browser, Page } from 'puppeteer';

@Injectable()
export class PuppeteerService implements OnModuleInit, OnModuleDestroy  {
    private readonly logger = new Logger(PuppeteerService.name);

    private browser: Browser;
    private page: Page;

    async onModuleInit(): Promise<void> {
        this.logger.log('Launching Puppeteer...');
        await this.launchBrowser();
    }

    private async launchBrowser(): Promise<void> {
        this.browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ]
        });

        this.page = await this.browser.newPage();

        await this.page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        );

        this.page.setDefaultTimeout(30000);

        this.logger.log('Puppeteer launched');
    }

    getPage(): Page {
        if (!this.page) {
            throw new Error('Puppeteer page is not initialized');
        }

        return this.page
    }

    getBrowser(): Browser {
        if (!this.browser) {
            throw new Error('Puppeteer browser is not initialized');
        }

        return this.browser;
    }

    async onModuleDestroy(): Promise<void> {
        this.logger.log('Closing Puppeteer...');

        try {
            await this.browser?.close();
        } catch (error) {
            this.logger.error('Failed to close browser', error);
        }
    }
}
