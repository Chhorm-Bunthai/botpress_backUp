import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { TelegramController } from './telegram/telegram.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TelegramModule],
  controllers: [TelegramController],
  providers: [AppService],
})
export class AppModule {}
