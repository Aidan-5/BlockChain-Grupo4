import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

function calcularDigitoVerificadorEcuador(primeros9: string): number {
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(primeros9[i], 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }

  const modulo = suma % 10;
  return modulo === 0 ? 0 : 10 - modulo;
}

function generarCedulaEcuatorianaValida(provinciaCodigo?: string): string {
  const prov = (provinciaCodigo && /^\d{2}$/.test(provinciaCodigo)) ? provinciaCodigo : '17';
  const tercerDigito = Math.floor(Math.random() * 6).toString(); // 0 a 5 persona natural
  let secuencial = '';
  for (let i = 0; i < 6; i++) {
    secuencial += Math.floor(Math.random() * 10).toString();
  }
  const primeros9 = prov + tercerDigito + secuencial;
  const digitoVerificador = calcularDigitoVerificadorEcuador(primeros9);
  return primeros9 + digitoVerificador.toString();
}

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
      include: { usuario: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAllHistory() {
    return this.prisma.solicitud.findMany({
      include: { usuario: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approve(id: number, institucionId: number) {
    const solicitud = await this.prisma.solicitud.findUnique({ where: { id } });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    if (solicitud.estado !== 'PENDIENTE') throw new BadRequestException('La solicitud ya fue procesada');

    let datosParsed: any = {};
    try {
      datosParsed = JSON.parse(solicitud.datosJSON);
    } catch (e) {}

    let cedula = '';
    if (datosParsed.cedula && datosParsed.cedula.length === 10) {
      cedula = datosParsed.cedula;
    } else {
      // Generar cédula oficial basada en la provincia elegida por el ciudadano
      cedula = generarCedulaEcuatorianaValida(datosParsed.provinciaCodigo);
      datosParsed.cedula = cedula;
    }

    // Actualizar datosJSON con la cédula asignada
    const datosActualizados = JSON.stringify(datosParsed);

    // Generate a private key mapping using the cedula
    const privateKey = crypto.createHash('sha256').update(cedula + 'SECRET_SALT_2026').digest('hex');

    // Mark as approved and update datosJSON
    await this.prisma.solicitud.update({
      where: { id },
      data: {
        estado: 'APROBADA',
        datosJSON: datosActualizados
      }
    });

    // Generate the actual Credencial
    let institucion = await this.prisma.institucion.findFirst();
    if (!institucion) {
      institucion = await this.prisma.institucion.create({
        data: {
          nombre: 'Registro Civil del Ecuador',
          tipo: 'Gubernamental',
        },
      });
    }

    const credencial = await this.prisma.credencial.create({
      data: {
        titulo: solicitud.tipoCredencial,
        descripcion: 'Emisión de identidad oficial',
        usuarioId: solicitud.usuarioId,
        institucionId: institucion.id,
        hashBlockchain: privateKey,
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
