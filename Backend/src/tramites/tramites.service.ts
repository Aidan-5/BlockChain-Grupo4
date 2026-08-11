import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTramiteDto } from './dto/create-tramite.dto';
import { UpdateTramiteDto } from './dto/update-tramite.dto';

@Injectable()
export class TramitesService {
  constructor(private prisma: PrismaService) {}

  async create(institucionId: number, data: CreateTramiteDto) {
    const institucion = await this.prisma.institucion.findUnique({
      where: { id: institucionId },
    });
    if (!institucion) {
      throw new NotFoundException(
        `Institución con id ${institucionId} no encontrada`,
      );
    }

    return this.prisma.tramite.create({
      data: {
        ...data,
        institucionId,
      },
    });
  }

  // Lista solo los trámites ACTIVOS: es el endpoint que consume el ciudadano
  // para ver qué puede hacer con una credencial vigente de esta institución.
  async findActivosByInstitucion(institucionId: number) {
    return this.prisma.tramite.findMany({
      where: { institucionId, activo: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findOwnedOrThrow(institucionId: number, id: number) {
    const tramite = await this.prisma.tramite.findFirst({
      where: { id, institucionId },
    });
    if (!tramite) {
      throw new NotFoundException(`Trámite con id ${id} no encontrado`);
    }
    return tramite;
  }

  async update(institucionId: number, id: number, data: UpdateTramiteDto) {
    await this.findOwnedOrThrow(institucionId, id);
    return this.prisma.tramite.update({
      where: { id },
      data,
    });
  }

  async remove(institucionId: number, id: number) {
    await this.findOwnedOrThrow(institucionId, id);
    return this.prisma.tramite.delete({ where: { id } });
  }
}
