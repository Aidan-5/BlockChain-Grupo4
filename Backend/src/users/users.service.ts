import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
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

  // Si se pasa institucionId (institución autenticada consultando su listado),
  // filtra SOLO a los ciudadanos con al menos una credencial emitida por esa
  // institución — antes una institución veía a TODOS los ciudadanos del sistema.
  async findAll(institucionId?: number) {
    return this.prisma.usuario.findMany({
      where: institucionId
        ? { credenciales: { some: { institucionId } } }
        : undefined,
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        identificacion: true,
        email: true,
        rol: true,
        wallet: true,
        did: true,
        activo: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return usuario;
  }

  async update(id: number, data: UpdateUserDto) {
    const usuario = await this.findOne(id);
    if (usuario.rol !== 'CIUDADANO') {
      throw new ForbiddenException(
        'Solo se pueden editar cuentas de ciudadanos',
      );
    }

    const estabaActivo = usuario.activo;

    const actualizado = await this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        identificacion: true,
        email: true,
        rol: true,
        wallet: true,
        did: true,
        activo: true,
        createdAt: true,
      },
    });

    // Notificación + email son "best effort": si fallan, no deben afectar la
    // respuesta HTTP de update() (el cambio de estado ya se aplicó).
    if (estabaActivo && data.activo === false) {
      await this.notificationsService.crear(
        id,
        'Cuenta suspendida',
        'Tu cuenta fue suspendida. Contacta a la institución.',
      );
      await this.mailService.enviar(
        usuario.email,
        'Tu cuenta fue suspendida',
        `<p>Hola ${usuario.nombre},</p><p>Tu cuenta fue suspendida. Contacta a la institución.</p>`,
      );
    } else if (!estabaActivo && data.activo === true) {
      await this.notificationsService.crear(
        id,
        'Cuenta reactivada',
        'Tu cuenta fue reactivada.',
      );
      await this.mailService.enviar(
        usuario.email,
        'Tu cuenta fue reactivada',
        `<p>Hola ${usuario.nombre},</p><p>Tu cuenta fue reactivada.</p>`,
      );
    }

    return actualizado;
  }

  async remove(id: number) {
    const usuario = await this.findOne(id);
    if (usuario.rol !== 'CIUDADANO') {
      throw new ForbiddenException(
        'Solo se pueden eliminar cuentas de ciudadanos',
      );
    }

    try {
      return await this.prisma.usuario.delete({
        where: { id },
      });
    } catch (err) {
      // P2003: el ciudadano tiene solicitudes/credenciales asociadas (FKs
      // requeridas, sin cascade — son registros de identidad, no se borran
      // en silencio). Se traduce a un mensaje claro en vez de un 500.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new BadRequestException(
          'No se puede eliminar este ciudadano porque tiene solicitudes o credenciales asociadas. Usa "Suspender" en su lugar.',
        );
      }
      throw err;
    }
  }
}
