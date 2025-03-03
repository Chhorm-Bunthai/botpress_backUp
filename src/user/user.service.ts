import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Telegraf } from 'telegraf';

@Injectable()
export class UserService implements OnApplicationBootstrap {
  public bot: Telegraf;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('WALLET_TELEGRAM_BOT_TOKEN');
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

    const webhookUrl = `${this.configService.get('NGROK_URL')}/user-profile/telegram-webhook/user`;

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

  async getUserProfile(userId: string) {
    console.log('Fetching user info for:', userId);
    // Use configService instead of direct process.env access for consistency
    const token = this.configService.get<string>('WALLET_TELEGRAM_BOT_TOKEN');

    try {
      // Step 1: Get basic user info
      const userInfoUrl = `https://api.telegram.org/bot${token}/getChat?chat_id=${userId}`;
      const userResponse = await axios.get(userInfoUrl);
      const userData = userResponse.data;

      console.log('this is result.photo', userData.result.photo);

      // Step 2: If photo information exists, get the file path
      if (userData.result.photo) {
        // Get the big photo file ID
        const fileId = userData.result.photo.big_file_id;

        // Get file path using getFile method
        const fileInfoUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
        const fileResponse = await axios.get(fileInfoUrl);
        const filePath = fileResponse.data.result.file_path;

        // Create download URL (Telegram file download URL format)
        const photoUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

        // Add the full photo URL to the response
        userData.result.photo_url = photoUrl;
      }

      return userData;
    } catch (error) {
      console.error(
        'Error fetching user profile:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}
