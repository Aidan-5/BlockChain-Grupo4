import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { CredentialsModule } from './credentials/credentials.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { WalletModule } from './wallet/wallet.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MailModule } from './mail/mail.module';
import { TramitesModule } from './tramites/tramites.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    InstitutionsModule,
    CredentialsModule,
    BlockchainModule,
    WalletModule,
    PrismaModule,
    AuthModule,
    SolicitudesModule,
    NotificationsModule,
    MailModule,
    TramitesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
