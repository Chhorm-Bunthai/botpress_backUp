import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService implements OnApplicationBootstrap {
  public bot: Telegraf;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined');
    }
    this.bot = new Telegraf(token);
  }

  async onApplicationBootstrap() {
    await this.setupWebhook();
    const ngrokUrl = this.configService.get<string>('NGROK_URL');
    if (!ngrokUrl) {
      throw new Error('NGROK_URL is not defined');
    }
  }

  private async setupWebhook() {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await this.bot.telegram.deleteWebhook();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const webhookUrl = `${this.configService.get('NGROK_URL')}/telegram-webhook`;

    await this.bot.telegram.setWebhook(webhookUrl);
    try {
      const webhookInfo = await this.bot.telegram.getWebhookInfo();
      console.log('this is webhook info', webhookInfo);
    } catch (err) {
      if (err.response?.error_code === 429) {
        console.log('Rate limited, waiting before retry...');

        const retryAfter =
          (err.response.parameters.retry_after || 1) * 1000 + 500;
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        return this.setupWebhook();
      }
      console.error('Webhook setup failed:', err.message);
      throw err;
    }
  }

  async sendMessage(chatId: number, text: string): Promise<void> {
    await axios.post(
      `${process.env.TELEGRAM_URL}${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: text,
      },
    );
  }

  async sendQuickReplies(
    chatId: number,
    payload: { text: string; actions: any[] },
  ): Promise<void> {
    const inlineKeyboard = payload.actions.map((action) => [
      {
        text: action.title,
        callback_data: action.payload,
      },
    ]);

    await axios.post(
      `${process.env.TELEGRAM_URL}${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: payload.text,
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      },
    );
  }

  async sendDropdownMenu(
    chatId: number,
    payload: {
      message: string;
      options: { label: string; value: string }[];
    },
  ): Promise<void> {
    const inlineKeyboard = payload.options.map((opt) => [
      {
        text: opt.label,
        callback_data: opt.value,
      },
    ]);

    await axios.post(
      `${process.env.TELEGRAM_URL}${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: payload.message,
        reply_markup: {
          inline_keyboard: inlineKeyboard,
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      },
    );
  }
}
