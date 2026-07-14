import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { CREDENTIAL_REGISTRY_ABI } from './credential-registry.abi';

export interface BlockchainVerificationResult {
  valid: boolean;
  timestamp: number;
  issuer: string;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const rpcUrl =
      this.configService.get<string>('BESU_RPC_URL') ??
      'http://127.0.0.1:8545';
    const privateKey = this.configService.get<string>('BLOCKCHAIN_PRIVATE_KEY');
    const contractAddress =
      this.configService.get<string>('CONTRACT_ADDRESS');

    if (!privateKey || !contractAddress) {
      this.logger.warn(
        'Blockchain no configurada. Defina BLOCKCHAIN_PRIVATE_KEY y CONTRACT_ADDRESS en .env',
      );
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(
      contractAddress,
      CREDENTIAL_REGISTRY_ABI,
      this.wallet,
    );
    this.isConfigured = true;
    this.logger.log(`Conectado a Besu en ${rpcUrl}`);
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  private ensureReady(): void {
    if (!this.isConfigured || !this.contract) {
      throw new ServiceUnavailableException(
        'Blockchain no configurada. Verifique BESU_RPC_URL, BLOCKCHAIN_PRIVATE_KEY y CONTRACT_ADDRESS.',
      );
    }
  }

  async registerCredential(hash: string): Promise<{ txHash: string }> {
    this.ensureReady();
    const tx = await this.contract!.registerCredential(hash);
    await tx.wait();
    return { txHash: tx.hash };
  }

  async verifyCredential(
    hash: string,
  ): Promise<BlockchainVerificationResult> {
    this.ensureReady();
    const [valid, timestamp, issuer] =
      await this.contract!.verifyCredential(hash);

    return {
      valid,
      timestamp: Number(timestamp),
      issuer,
    };
  }
}
