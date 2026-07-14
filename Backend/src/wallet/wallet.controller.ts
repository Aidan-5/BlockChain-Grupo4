import { Body, Controller, Post } from '@nestjs/common';
import { GenerateDidDto } from './dto/generate-did.dto';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('did')
  generateDid(@Body() body: GenerateDidDto) {
    return {
      wallet: body.wallet,
      did: this.walletService.generateDid(body.wallet),
    };
  }
}
