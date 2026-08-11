import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateCredentialDto } from './dto/create-credential.dto';

// La credencial vence 8 años después de emitida (ver Credencial.fechaCaducidad).
function calcularFechaCaducidad(emitidaEn: Date): Date {
  const fechaCaducidad = new Date(emitidaEn);
  fechaCaducidad.setFullYear(fechaCaducidad.getFullYear() + 8);
  return fechaCaducidad;
}

// "Firma" (no criptográfica real, mismo nivel de fidelidad que hashBlockchain
// / privateKey ya simulados en el proyecto) de la institución emisora sobre
// la credencial, para poder detectar manipulación de sus datos básicos.
function calcularFirmaEmisorHash(payload: {
  institucionId: number;
  usuarioId: number;
  hashBlockchain: string | null;
  emitidaEn: Date;
}): string {
  const content =
    `${payload.institucionId}` +
    `${payload.usuarioId}` +
    `${payload.hashBlockchain ?? ''}` +
    payload.emitidaEn.toISOString();

  return createHash('sha256').update(content).digest('hex');
}

@Injectable()
export class CredentialsService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private blockchainService: BlockchainService,
  ) {}

  async create(data: CreateCredentialDto, institucionId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: data.usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException(
        `Usuario con id ${data.usuarioId} no encontrado`,
      );
    }

    const institucion = await this.prisma.institucion.findUnique({
      where: { id: institucionId },
    });

    if (!institucion) {
      throw new NotFoundException(
        `Institución con id ${institucionId} no encontrada`,
      );
    }

    const emitidaEn = new Date();
    const hashBlockchain = this.walletService.generateCredentialHash({
      titulo: data.titulo,
      descripcion: data.descripcion,
      usuarioId: data.usuarioId,
      institucionId,
      emitidaEn,
    });

    let txHash: string | null = null;

    if (this.blockchainService.isReady()) {
      const result =
        await this.blockchainService.registerCredential(hashBlockchain);
      txHash = result.txHash;
    }

    const firmaEmisorHash = calcularFirmaEmisorHash({
      institucionId,
      usuarioId: data.usuarioId,
      hashBlockchain,
      emitidaEn,
    });

    const credencial = await this.prisma.credencial.create({
      data: {
        ...data,
        institucionId,
        hashBlockchain,
        emitidaEn,
        fechaCaducidad: calcularFechaCaducidad(emitidaEn),
        firmaEmisorHash,
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

  // institucionId: cuando se pasa, restringe el listado a la propia institución
  // autenticada (ver CredentialsController).
  async findAll(institucionId?: number) {
    return this.prisma.credencial.findMany({
      where: institucionId !== undefined ? { institucionId } : undefined,
      include: {
        usuario: true,
        institucion: true,
      },
    });
  }

  // institucionId: cuando se pasa, una credencial emitida por otra institución
  // se reporta como no encontrada (evita fuga de datos entre instituciones).
  // Se omite para el flujo público de verificación (verify()).
  async findOne(id: number, institucionId?: number) {
    const credencial = await this.prisma.credencial.findUnique({
      where: { id },
      include: {
        usuario: true,
        institucion: true,
      },
    });

    if (
      !credencial ||
      (institucionId !== undefined &&
        credencial.institucionId !== institucionId)
    ) {
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

  async findByUser(usuarioId: number) {
    return this.prisma.credencial.findMany({
      where: { usuarioId },
      include: {
        usuario: true,
        institucion: true,
        // La solicitud original trae datosJSON (los atributos de identidad
        // que el ciudadano llenó para esta institución) y su tipoCredencial.
        solicitud: true,
      },
    });
  }
}
