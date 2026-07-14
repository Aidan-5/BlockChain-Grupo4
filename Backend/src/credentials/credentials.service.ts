import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateCredentialDto } from './dto/create-credential.dto';

@Injectable()
export class CredentialsService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private blockchainService: BlockchainService,
  ) {}

  async create(data: CreateCredentialDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: data.usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException(
        `Usuario con id ${data.usuarioId} no encontrado`,
      );
    }

    const institucion = await this.prisma.institucion.findUnique({
      where: { id: data.institucionId },
    });

    if (!institucion) {
      throw new NotFoundException(
        `Institución con id ${data.institucionId} no encontrada`,
      );
    }

    const emitidaEn = new Date();
    const hashBlockchain = this.walletService.generateCredentialHash({
      titulo: data.titulo,
      descripcion: data.descripcion,
      usuarioId: data.usuarioId,
      institucionId: data.institucionId,
      emitidaEn,
    });

    let txHash: string | null = null;

    if (this.blockchainService.isReady()) {
      const result =
        await this.blockchainService.registerCredential(hashBlockchain);
      txHash = result.txHash;
    }

    const credencial = await this.prisma.credencial.create({
      data: {
        ...data,
        hashBlockchain,
        emitidaEn,
      },
      include: {
        usuario: true,
        institucion: true,
      },
    });

    return {
      ...credencial,
      blockchain: {
        registrada: this.blockchainService.isReady(),
        txHash,
      },
    };
  }

  async findAll() {
    return this.prisma.credencial.findMany({
      include: {
        usuario: true,
        institucion: true,
      },
    });
  }

  async findOne(id: number) {
    const credencial = await this.prisma.credencial.findUnique({
      where: { id },
      include: {
        usuario: true,
        institucion: true,
      },
    });

    if (!credencial) {
      throw new NotFoundException(`Credencial con id ${id} no encontrada`);
    }

    return credencial;
  }

  async verify(id: number) {
    const credencial = await this.findOne(id);

    if (!credencial.hashBlockchain) {
      throw new BadRequestException(
        'La credencial no tiene hash registrado en blockchain',
      );
    }

    if (!this.blockchainService.isReady()) {
      return {
        credencialId: credencial.id,
        hash: credencial.hashBlockchain,
        valida: null,
        mensaje: 'Blockchain no configurada en el backend',
      };
    }

    const onChain = await this.blockchainService.verifyCredential(
      credencial.hashBlockchain,
    );

    const hashRecalculado = this.walletService.generateCredentialHash({
      titulo: credencial.titulo,
      descripcion: credencial.descripcion,
      usuarioId: credencial.usuarioId,
      institucionId: credencial.institucionId,
      emitidaEn: credencial.emitidaEn,
    });

    return {
      credencialId: credencial.id,
      hash: credencial.hashBlockchain,
      hashCoincide: hashRecalculado === credencial.hashBlockchain,
      validaEnBlockchain: onChain.valid,
      timestamp: onChain.timestamp,
      emisorEnBlockchain: onChain.issuer,
      institucion: credencial.institucion,
      usuario: credencial.usuario,
    };
  }
}
