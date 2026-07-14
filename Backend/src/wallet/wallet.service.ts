import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class WalletService {
  generateDid(wallet: string): string {
    return `did:besu:${wallet.toLowerCase()}`;
  }

  generateCredentialHash(payload: {
    titulo: string;
    descripcion: string;
    usuarioId: number;
    institucionId: number;
    emitidaEn: Date;
  }): string {
    const content = JSON.stringify({
      titulo: payload.titulo,
      descripcion: payload.descripcion,
      usuarioId: payload.usuarioId,
      institucionId: payload.institucionId,
      emitidaEn: payload.emitidaEn.toISOString(),
    });

    return createHash('sha256').update(content).digest('hex');
  }

  isValidWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}
