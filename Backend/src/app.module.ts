import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { CredentialsModule } from './credentials/credentials.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { WalletModule } from './wallet/wallet.module';
import { PrismaModule } from './prisma/prisma.module';


@Module({
  imports: [UsersModule, InstitutionsModule, CredentialsModule, BlockchainModule, WalletModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
