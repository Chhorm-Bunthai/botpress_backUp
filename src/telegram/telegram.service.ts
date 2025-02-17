import { Injectable, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService implements OnModuleInit {
  public bot: Telegraf;
  

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined');
    }
    this.bot = new Telegraf(token);
  }

  async onModuleInit() {
    await this.setupWebhook();
    this.registerListeners();
    const ngrokUrl = this.configService.get<string>('NGROK_URL');
    if (!ngrokUrl) {
      throw new Error('NGROK_URL is not defined');
    }
    const webhookUrl = `${ngrokUrl}/telegram-webhook`;
  }

  private async setupWebhook() {
    try {
      // Add delay before making API calls
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Delete existing webhook first
      await this.bot.telegram.deleteWebhook();
      
      // Wait a bit before setting new webhook
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const webhookUrl = `${this.configService.get('NGROK_URL')}/telegram-webhook`;
      
      // Set webhook only once
      await this.bot.telegram.setWebhook(webhookUrl);

      // Get webhook info for verification
      const webhookInfo = await this.bot.telegram.getWebhookInfo();
      console.log('Webhook info:', webhookInfo);
    } catch (err) {
      if (err.response?.error_code === 429) {
        console.log('Rate limited, waiting before retry...');
        // Wait for the suggested retry time plus a small buffer
        const retryAfter = (err.response.parameters.retry_after || 1) * 1000 + 500;
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        // Retry the setup
        return this.setupWebhook();
      }
      console.error('Webhook setup failed:', err.message);
      throw err;
    }
  }

  private registerListeners() {
    this.bot.start( async (ctx) => {
      const userId = `telegram_${ctx.message.chat.id}`;
      const text = ctx.message.text;
      console.log('this is ctx', ctx);

      // Store message for Botpress (see Step 4)
      this.messageQueue.push({ userId, text });
    });
  }

  // Temporary storage (replace with Redis in production)
  private messageQueue: { userId: string; text: string }[] = [];

  getMessages() {
    return this.messageQueue.splice(0); // Clears the queue
  }

  async sendMessage(userId: string, text: string) {
    const chatId = userId.replace('telegram_', '');
    await this.bot.telegram.sendMessage(chatId, text);
  }
}
