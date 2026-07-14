import { Controller, Get, Param } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('status')
  status() {
    return {
      configured: this.blockchainService.isReady(),
    };
  }

  @Get('verify/:hash')
  verify(@Param('hash') hash: string) {
    return this.blockchainService.verifyCredential(hash);
  }
}
