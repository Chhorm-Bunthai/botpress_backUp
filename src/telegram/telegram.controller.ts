import { Controller, Post, Body } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import axios from 'axios';

@Controller('telegram-webhook')
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  @Post()
  async handleWebhook(@Body() update: any) {
    const chatId =
      update.message?.chat?.id || update.callback_query?.message?.chat?.id;
    if (!chatId) {
      console.error('No chat ID found in the update:', update);
      return;
    }
    console.log('this is update', update);

    let botpressPayload;

    if (update.message?.text) {
      botpressPayload = {
        type: 'text',
        text: update.message.text,
        includedContexts: ['global'],
        metadata: update,
      };
    } else if (update.callback_query) {
      botpressPayload = {
        type: 'payload',
        payload: update.callback_query.data,
        // Remove the raw field
        // raw: update,
      };
    }

    if (update.message?.text === '/start') {
      try {
        const fromBotpress = await axios.post(
          `${process.env.BOTPRESS_URL}/api/v1/bots/user-info/converse/${chatId}`,
          botpressPayload,
        );

        console.log('fromBotpress', fromBotpress.data.responses[0].type);

        for (const message of fromBotpress.data.responses) {
          if (message.type === 'text') {
            await this.telegramService.sendMessage(chatId, message.text);
          }
        }
      } catch (error) {
        console.error(
          'Error communicating with Botpress:',
          error.response?.data || error.message,
        );
      }
    }
  }
}
