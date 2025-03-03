import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user-profile')
export class UserController {
  private updateData: any = {};
  constructor(private readonly userService: UserService) {}

  // In user.controller.ts
  @Post('telegram-webhook/user')
  async handleUserBotWebhook(@Body() update: any) {
    console.log('this is update from wallet', update);
    this.updateData = update;
    return this.userService.bot.handleUpdate(update);
  }

  @Get()
  async getUserInfo(): Promise<any> {
    try {
      if (
        !this.updateData ||
        !this.updateData.message ||
        !this.updateData.message.chat
      ) {
        return {
          success: false,
          error:
            'No user has interacted with the bot yet or user data is not available',
        };
      }
      const userData = await this.userService.getUserProfile(
        this.updateData.message.chat.id,
      );
      return userData;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
