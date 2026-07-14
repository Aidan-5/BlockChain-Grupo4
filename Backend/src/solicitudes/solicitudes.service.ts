import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class SolicitudesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { usuarioId: number; tipoCredencial: string; datosJSON: string }) {
    // Generate a temporary tracking hash for the request
    const hashTemporal = crypto.createHash('sha256').update(Date.now().toString() + data.usuarioId).digest('hex');

    return this.prisma.solicitud.create({
      data: {
        usuarioId: data.usuarioId,
        tipoCredencial: data.tipoCredencial,
        datosJSON: data.datosJSON,
        hashTemporal,
        estado: 'PENDIENTE'
      }
    });
  }

  async findAllPending() {
    return this.prisma.solicitud.findMany({
      where: { estado: 'PENDIENTE' },
      include: { usuario: true }
    });
  }

  async approve(id: number, institucionId: number) {
    const solicitud = await this.prisma.solicitud.findUnique({ where: { id } });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    if (solicitud.estado !== 'PENDIENTE') throw new BadRequestException('La solicitud ya fue procesada');

    let cedula = '0000000000';
    try {
      const datosParsed = JSON.parse(solicitud.datosJSON);
      if (datosParsed.cedula) cedula = datosParsed.cedula;
    } catch (e) {}

    // Generate a private key mapping using the cedula
    const privateKey = crypto.createHash('sha256').update(cedula + 'SECRET_SALT_2026').digest('hex');

    // Mark as approved
    await this.prisma.solicitud.update({
      where: { id },
      data: { estado: 'APROBADA' }
    });

    // Generate the actual Credencial
    let institucion = await this.prisma.institucion.findFirst();
    if (!institucion) {
      institucion = await this.prisma.institucion.create({
        data: { nombre: 'Registro Civil del Ecuador', did: 'did:ssi:ec:1' }
      });
    }

    const credencial = await this.prisma.credencial.create({
      data: {
        titulo: solicitud.tipoCredencial,
        descripcion: 'Emisión de identidad oficial',
        usuarioId: solicitud.usuarioId,
        institucionId: institucion.id,
        hashBlockchain: privateKey, // In a real app we'd hash the privateKey, but here we use it directly as the hash registered
        emitidaEn: new Date()
      }
    });

    return {
      message: 'Solicitud aprobada y credencial en proceso de emisión',
      solicitudId: id,
      credencialId: credencial.id,
      clavePrivadaAsignada: privateKey,
      cedulaAsociada: cedula
    };
  }

  async findByUsuario(usuarioId: number) {
    return this.prisma.solicitud.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
