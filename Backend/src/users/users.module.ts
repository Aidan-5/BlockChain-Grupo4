import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [WalletModule, NotificationsModule, MailModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
