import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { BotpressModule } from './botpress/botpress.module';
import { ConfigModule } from '@nestjs/config';
import { TelegramController } from './telegram/telegram.controller';
import { BotpressController } from './botpress/botpress.controller';

@Module({
  imports: [ ConfigModule.forRoot({ isGlobal: true }),TelegramModule, BotpressModule],
  controllers: [TelegramController, BotpressController],
  providers: [AppService],
})
export class AppModule {}
