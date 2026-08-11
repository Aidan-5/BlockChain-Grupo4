import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Uso interno desde otros servicios (SolicitudesService, UsersService, etc.),
  // no se expone directamente por HTTP.
  async crear(destinatarioUsuarioId: number, titulo: string, mensaje: string) {
    return this.prisma.notificacion.create({
      data: {
        destinatarioUsuarioId,
        titulo,
        mensaje,
      },
    });
  }

  async findAllForUser(usuarioId: number) {
    return this.prisma.notificacion.findMany({
      where: { destinatarioUsuarioId: usuarioId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async marcarLeida(id: number, usuarioId: number) {
    const notificacion = await this.prisma.notificacion.findUnique({
      where: { id },
    });
    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }
    if (notificacion.destinatarioUsuarioId !== usuarioId) {
      throw new ForbiddenException('Esta notificación no te pertenece');
    }

    return this.prisma.notificacion.update({
      where: { id },
      data: { leida: true },
    });
  }
}
