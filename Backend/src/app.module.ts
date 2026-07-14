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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
