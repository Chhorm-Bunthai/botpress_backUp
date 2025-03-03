import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { TelegramController } from './telegram/telegram.controller';
import { WhitelistService } from './whitelist/whitelist.service';
import { WhitelistController } from './whitelist/whitelist.controller';
import { WhitelistModule } from './whitelist/whitelist.module';
import { DatabaseService } from './database/database.service';
import { DatabaseController } from './database/database.controller';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TelegramModule,
    WhitelistModule,
    DatabaseModule,
    UserModule,
  ],
  controllers: [TelegramController, WhitelistController, DatabaseController],
  providers: [AppService, WhitelistService, DatabaseService],
})
export class AppModule {}
