import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PuppeteerService } from 'src/puppeteer/puppeteer.service';

@Injectable()
export class AvitoService implements OnModuleInit {
    private readonly logger = new Logger(AvitoService.name);
    constructor(
        private readonly puppeteerService: PuppeteerService
    ) {}

    async onModuleInit() {
        try {
            await this.login();
            await this.openDialog();
        } catch (error) {
            this.logger.error('AvitoService initialization failed', error);
        }
    }

    private async login(): Promise<void> {
        const page = this.puppeteerService.getPage();
        this.logger.log('Opening Avito login page');

        await page.goto('https://www.avito.ru/#login?authsrc=h', {
            waitUntil: 'domcontentloaded'
        });

        await page.waitForSelector('input[name="login"]', { timeout: 15000 });
        this.logger.log('Login form detected');

        await page.type('input[name="login"]', process.env.AVITO_LOGIN ?? '', {
            delay: 50
        });

        await page.type('input[name="password"]', process.env.AVITO_PASSWORD ?? '', {
            delay: 50
        });
        this.logger.log('Credentials entered');

        await page.click('button[type="submit"]');
        this.logger.log('Login form submitted');

        this.logger.warn('Manual verification (CAPTCHA/SMS) is required.');
        await page.waitForSelector('[data-marker="channels/list"]', { timeout: 0 });

        this.logger.log('Successfully logged in to Avito');
    }

    private async openDialog(): Promise<any> {
        const page = this.puppeteerService.getPage();

        const dialogFound = await page.evaluate(() => {
            const dialogs  = Array.from(
                document.querySelectorAll('[data-marker="channels/user-title"] h5')
            );

            const target = dialogs.find(item => item.textContent?.includes('yandiev'));

            if (!target) return false;

            (target as HTMLElement).click();
            return true;
        });

        if (!dialogFound) {
            throw new Error('Dialog with target user not found');
        }

        this.logger.log('Dialog opened');
    }

    private async listenMessages(): Promise<void> {
        const page = this.puppeteerService.getPage();

        this.logger.log('Listening for new messages');

        await page.exposeFunction('emitNewMessage', (text: string) => {
            this.logger.log(`New message: ${ text }`);
            // this.messagesService.emit({
            //     text,
            //     author: 'Рушан',
            //     createdAt: new Date(),
            // });
        });

        await page.evaluate(() => {
            const container = document.querySelector('[data-marker="message"]');

            if (!container) return;

            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (
                            node.nodeType === 1 &&
                            (node as HTMLElement).innerText
                        ) {
                            // @ts-ignore
                            window.emitNewMessage(
                                (node as HTMLElement).innerText,
                            );
                        }
                    });
                });
            });

            observer.observe(container, {
                childList: true,
                subtree: true
            });
        });

        this.logger.log('MutationObserver attached');
    }
}
