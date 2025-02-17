import { Controller, Post, Headers, Body, UnauthorizedException } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram-webhook')
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  @Post()
  async handleWebhook(
    @Body() update: any,
  ) {
    if (update.message?.text === '/start') {
      const chatId = update.message.chat.id;
      await this.telegramService.bot.telegram.sendMessage(chatId, `Hello! I am a bot ${JSON.stringify(update.message.from)}!`);
      return { status: 'ok' };
    }
    await this.telegramService.bot.handleUpdate(update);
    return { status: 'ok' };
  }
}