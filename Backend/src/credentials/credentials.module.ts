import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { WalletModule } from '../wallet/wallet.module';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';

@Module({
  imports: [WalletModule, BlockchainModule],
  controllers: [CredentialsController],
  providers: [CredentialsService],
})
export class CredentialsModule {}
