import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async create(data: CreateUserDto) {
    const payload = { ...data };

    if (payload.wallet && !payload.did) {
      payload.did = this.walletService.generateDid(payload.wallet);
    }

    return this.prisma.usuario.create({
      data: payload,
    });
  }

  async findAll() {
    return this.prisma.usuario.findMany();
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return usuario;
  }
}
