import { Controller, Post, Body } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import axios from 'axios';

@Controller('telegram-webhook')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post()
  async handleWebhook(@Body() update: any): Promise<void> {
    const chatId =
      update.message?.chat?.id || update.callback_query?.message?.chat?.id;
    if (!chatId) {
      console.error('No chat ID found in the update:', update);
      return;
    }

    const botpressPayload = this.buildBotpressPayload(update);
    console.log('this is update logic from telegram', update);

    await this.sendToBotpress(chatId, botpressPayload);
  }

  private buildBotpressPayload(update: any): any {
    if (update.callback_query) {
      return {
        type: 'text',
        text: update.callback_query.data,
        includedContexts: ['global'],
        metadata: update.callback_query,
      };
    } else if (update.message?.text) {
      return {
        type: 'text',
        text: update.message.text,
        includedContexts: ['global'],
        metadata: update,
      };
    } else {
      return {
        type: 'text',
        text: update.callback_query.data,
        includedContexts: ['global'],
        metadata: update.callback_query,
      };
    }
  }

  async sendToBotpress(chatId: number, botpressPayload: any): Promise<void> {
    console.log('this is botpressPayload', botpressPayload);
    try {
      const response = await axios.post(
        `${process.env.BOTPRESS_URL}/api/v1/bots/wing-loan-flow-messenger/converse/${chatId}`,
        botpressPayload,
      );
      for (const msg of response.data.responses) {
        console.log('this msg', msg);
        await this.handleBotpressMessage(chatId, msg);
      }
    } catch (error) {
      console.error(
        'Error communicating with Botpress:',
        error.response?.data || error.message,
      );
    }
  }

  private async handleBotpressMessage(chatId: number, msg: any): Promise<void> {
    if (msg.type === 'text') {
      await this.telegramService.sendMessage(chatId, msg.text);
    } else if (msg.type === 'card') {
      await this.telegramService.sendQuickReplies(chatId, {
        text: msg.subtitle,
        actions: msg.actions,
      });
    } else if (msg.type === 'dropdown') {
      await this.telegramService.sendDropdownMenu(chatId, {
        message: msg.message,
        options: msg.options,
      });
    } else {
      console.warn('Unknown message type:', msg.type);
    }
  }
}
