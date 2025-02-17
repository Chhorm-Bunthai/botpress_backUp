import { Controller, Get, Post, Body } from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service';

@Controller('botpress')
export class BotpressController {
  constructor(private telegramService: TelegramService) {}

  @Post('telegram-webhook')
  async handleWebhook(@Body() update: any) {
    await this.telegramService.bot.handleUpdate(update);
    return { status: 'ok' };
  }

  @Get('messages')
  async getMessages() {
    return { messages: this.telegramService.getMessages() };
  }

  @Post('response')
  async handleResponse(@Body() response: { userId: string; text: string }) {
    await this.telegramService.sendMessage(response.userId, response.text);
    return { status: 'ok' };
  }
}