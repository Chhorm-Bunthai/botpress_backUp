import { Module } from '@nestjs/common';
import { BotpressService } from './botpress.service';
import { BotpressController } from './botpress.controller';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  providers: [BotpressService],
  controllers: [BotpressController]
})
export class BotpressModule {}
