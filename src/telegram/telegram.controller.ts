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
    console.log('this is update logic', update);

    await this.sendToBotpress(chatId, botpressPayload);
  }

  private buildBotpressPayload(update: any): any {
    if (update.message?.text) {
      return {
        type: 'text',
        text: update.message.text,
        includedContexts: ['global'],
        metadata: update,
      };
    } else if (update.callback_query) {
      return {
        type: 'text',
        // text: update.callback_query.data,
        includedContexts: ['global'],
        metadata: update.callback_query,
      };
    }
  }

  async sendToBotpress(chatId: number, botpressPayload: any): Promise<void> {
    // console.log('chatId', chatId);
    // console.log('botpressPayload', botpressPayload);
    try {
      const response = await axios.post(
        `${process.env.BOTPRESS_URL}/api/v1/bots/user-info/converse/${chatId}`,
        botpressPayload,
      );

      for (const msg of response.data.responses) {
        console.log('this is chatId', chatId);
        console.log('this is msg', msg);
        switch (msg.type) {
          case 'text':
            await this.telegramService.sendMessage(chatId, msg.text);
            break;

          case 'card':
            await this.telegramService.sendQuickReplies(chatId, {
              text: msg.subtitle,
              options: msg.actions,
            });
            break;
          case 'dropdown':
            await this.telegramService.sendDropdownMenu(chatId, {
              message: msg.message,
              options: msg.options,
            });
            break;

          default:
            console.warn('Unknown message type:', msg.type);
            break;
        }
      }
    } catch (error) {
      console.error(
        'Error communicating with Botpress:',
        error.response?.data || error.message,
      );
    }
  }

  private async handleBotpressMessage(chatId: number, msg: any): Promise<void> {
    switch (msg.type) {
      case 'text':
        await this.telegramService.sendMessage(chatId, msg.text);
        break;

      case 'card':
        await this.telegramService.sendQuickReplies(chatId, {
          text: msg.subtitle,
          options: msg.actions,
        });
        break;
      case 'dropdown':
        await this.telegramService.sendDropdownMenu(chatId, {
          message: msg.message,
          options: msg.options,
        });
        break;

      default:
        console.warn('Unknown message type:', msg.type);
        break;
    }
  }
}
