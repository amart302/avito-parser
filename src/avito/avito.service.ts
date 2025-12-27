import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MessagesService } from 'src/messages/messages.service';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';

@Injectable()
export class AvitoService implements OnModuleInit {
    private readonly logger = new Logger(AvitoService.name);
    constructor(
        private readonly puppeteerService: PuppeteerService,
        private readonly messagesService: MessagesService
    ) {}

    async onModuleInit() {
        try {
            await this.login();
            await this.openDialog();
            await this.listenMessages();
        } catch (error) {
            this.logger.error('AvitoService initialization failed', error);
        }
    }

    private async login(): Promise<void> {
        const page = this.puppeteerService.getPage();

        this.logger.log('Checking Avito authorization');

        await page.goto('https://www.avito.ru/', { waitUntil: 'domcontentloaded' });

        const profileMenu = await page.$('[data-marker="header/menu-profile"]');

        if (profileMenu) {
            this.logger.log('Already authorized in Avito');
            return;
        }

        this.logger.log('User not authorized, performing login');

        await page.goto('https://www.avito.ru/#login?authsrc=h', { waitUntil: 'domcontentloaded' });

        await page.waitForSelector('input[name="login"]', { timeout: 20000 });

        await page.type('input[name="login"]', process.env.AVITO_LOGIN ?? '', { delay: 50 });
        await page.type('input[name="password"]', process.env.AVITO_PASSWORD ?? '', { delay: 50 });

        await page.click('button[type="submit"]');

        this.logger.warn('Waiting for login confirmation (SMS/captcha may be required)');

        await page.waitForSelector('[data-marker="header/menu-profile"]', { timeout: 45000 });

        if (!await page.$('[data-marker="header/menu-profile"]')) {
            this.logger.error('Authorization failed');
            throw new Error('Authorization failed');
        }

        this.logger.log('Successfully logged in to Avito');
    }

    private async openDialog(): Promise<void> {
        const page = this.puppeteerService.getPage();
        const targetUsername = process.env.AVITO_TARGET_USER || 'Рушан Натфуллин';

        this.logger.log('Opening Avito messenger and searching for dialog');

        await page.goto('https://www.avito.ru/profile/messenger', { waitUntil: 'domcontentloaded' });

        await page.waitForSelector('[data-marker="channels/list"]', { timeout: 20000 });

        const dialogFound = await page.evaluate((username) => {
            const dialogs = Array.from(document.querySelectorAll('[data-marker="channels/user-title"]'));

            const target = dialogs.find(item => item.textContent.toLowerCase().includes(username.toLowerCase()));

            if (!target) return false;

            (target as HTMLElement).click();

            return true;
        }, targetUsername);

        if (!dialogFound) throw new Error('Dialog not found');

        await page.waitForSelector('[data-marker="message"]', { timeout: 15000 });

        this.logger.log('Dialog successfully opened');
    }

    private async listenMessages(): Promise<void> {
        const page = this.puppeteerService.getPage();

        this.logger.log('Starting message listener');

        await page.exposeFunction('emitNewMessage', (text) => {            
            this.messagesService.emit({ text });
        });

        await page.evaluate(() => {
            const container = document.querySelector('[data-marker="messagesHistory/list"]');

            if (!container) {
                console.error('Messages container not found');
                return;
            }

            let lastMessageText = (() => {
                const messages = container.querySelectorAll('[data-marker="message"]');
                const last = messages[ messages.length - 1 ];
                const textEl = last?.querySelector('[data-marker="messageText"]');
                return textEl?.textContent?.trim() ?? null;
            })();

            const observer = new MutationObserver(() => {
                const messages = container.querySelectorAll('[data-marker="message"]');
                if (!messages.length) return;

                const lastMessage = messages[messages.length - 1];
                const textEl = lastMessage.querySelector('[data-marker="messageText"]');
                const text = textEl?.textContent;
                console.log(text);
                

                if (!text || text === lastMessageText) {
                    return;
                }

                lastMessageText = text;

                // @ts-ignore
                window.emitNewMessage(text);
            });

            observer.observe(container, {
                childList: true,
                subtree: true,
                characterData: true,
            });
        });

        this.logger.log('Message listener initialized');
    }

}
