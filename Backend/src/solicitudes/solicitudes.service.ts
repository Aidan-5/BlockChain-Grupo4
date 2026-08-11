import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { TipoIdentidad } from '@prisma/client';
import * as crypto from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

// Título de la Credencial emitida según el tipo de identidad solicitado.
// Se usa tanto para crear la credencial en approve() como para detectar
// duplicados (Credencial no tiene un campo tipado, solo titulo libre).
const TITULO_POR_TIPO: Record<TipoIdentidad, string> = {
  CEDULA: 'Cédula de Identidad',
  DISCAPACIDAD: 'Carnet de Discapacidad',
};

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

// La credencial vence 8 años después de emitida (ver Credencial.fechaCaducidad).
// Mismo helper que CredentialsService.create(), duplicado a propósito: ambos
// son los únicos dos lugares que crean una Credencial y no comparten módulo.
function calcularFechaCaducidad(emitidaEn: Date): Date {
  const fechaCaducidad = new Date(emitidaEn);
  fechaCaducidad.setFullYear(fechaCaducidad.getFullYear() + 8);
  return fechaCaducidad;
}

// "Firma" (no criptográfica real, mismo nivel de fidelidad que hashBlockchain
// / privateKey ya simulados en este servicio) de la institución emisora sobre
// la credencial.
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

  return crypto.createHash('sha256').update(content).digest('hex');
}

function generarCedulaEcuatorianaValida(provinciaCodigo?: string): string {
  const prov =
    provinciaCodigo && /^\d{2}$/.test(provinciaCodigo) ? provinciaCodigo : '17';
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
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  async create(data: CreateSolicitudDto, usuarioId: number) {
    // Máximo 1 identidad de cada tipo (CEDULA / DISCAPACIDAD) por ciudadano
    // y por institución. Una solicitud RECHAZADA previa no bloquea un nuevo
    // intento, solo PENDIENTE/APROBADA cuentan.
    const existente = await this.prisma.solicitud.findFirst({
      where: {
        usuarioId,
        institucionId: data.institucionId,
        tipoCredencial: data.tipoCredencial,
        estado: { in: ['PENDIENTE', 'APROBADA'] },
      },
    });
    if (existente) {
      throw new BadRequestException(
        `Ya tienes una identidad de tipo ${TITULO_POR_TIPO[data.tipoCredencial]} solicitada o aprobada con esta institución`,
      );
    }

    // Generate a temporary tracking hash for the request
    const hashTemporal = crypto
      .createHash('sha256')
      .update(Date.now().toString() + usuarioId)
      .digest('hex');

    const solicitud = await this.prisma.solicitud.create({
      data: {
        usuarioId,
        institucionId: data.institucionId,
        tipoCredencial: data.tipoCredencial,
        datosJSON: data.datosJSON,
        hashTemporal,
        estado: 'PENDIENTE',
      },
    });

    // Notifica al usuario de la institución elegida (si tiene una cuenta
    // vinculada) de que llegó una nueva solicitud a revisar.
    const institucion = await this.prisma.institucion.findUnique({
      where: { id: data.institucionId },
      include: { usuario: true },
    });
    if (institucion?.usuario) {
      const ciudadano = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
      });
      await this.notificationsService.crear(
        institucion.usuario.id,
        'Nueva solicitud de identidad',
        `Nueva solicitud de identidad de ${ciudadano?.nombre ?? 'un ciudadano'}`,
      );
    }

    return solicitud;
  }

  // institucionId: la solicitud ahora lleva la institución que el ciudadano
  // eligió al pedir su identidad (ver create()) — cada institución solo debe
  // ver/aprobar las que le corresponden, no las de todas las instituciones.
  async findAllPending(institucionId: number) {
    return this.prisma.solicitud.findMany({
      where: { estado: 'PENDIENTE', institucionId },
      include: { usuario: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllHistory(institucionId: number) {
    return this.prisma.solicitud.findMany({
      where: { institucionId },
      include: { usuario: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: number, institucionId: number) {
    const solicitud = await this.prisma.solicitud.findUnique({ where: { id } });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    if (solicitud.estado !== 'PENDIENTE')
      throw new BadRequestException('La solicitud ya fue procesada');

    // La institución que aprueba debe ser la misma que el ciudadano eligió al
    // solicitar (si no, cualquier institución podría aprobar solicitudes
    // dirigidas a otra y quedarse con el crédito de la emisión).
    if (solicitud.institucionId !== institucionId) {
      throw new ForbiddenException(
        'Esta solicitud fue dirigida a otra institución',
      );
    }

    // Se valida ANTES de tocar la solicitud: si la institución no existe,
    // la solicitud debe seguir PENDIENTE (antes quedaba APROBADA sin
    // credencial y sin forma de reintentar, porque approve() solo procesa
    // solicitudes PENDIENTE).
    const institucion = await this.prisma.institucion.findUnique({
      where: { id: institucionId },
    });
    if (!institucion) {
      throw new NotFoundException(
        `Institución con id ${institucionId} no encontrada`,
      );
    }

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
    const privateKey = crypto
      .createHash('sha256')
      .update(cedula + 'SECRET_SALT_2026')
      .digest('hex');

    const titulo = TITULO_POR_TIPO[solicitud.tipoCredencial];

    // Red de seguridad adicional contra condiciones de carrera: aunque create()
    // ya valida esto al crear la Solicitud, aquí se revalida justo antes de
    // emitir la Credencial (p.ej. dos solicitudes distintas del mismo tipo
    // aprobadas casi simultáneamente).
    const credencialExistente = await this.prisma.credencial.findFirst({
      where: {
        usuarioId: solicitud.usuarioId,
        institucionId: institucion.id,
        titulo,
      },
    });
    if (credencialExistente) {
      throw new BadRequestException(
        `Este ciudadano ya tiene una credencial de tipo ${titulo} emitida por esta institución`,
      );
    }

    // Mark as approved and update datosJSON
    await this.prisma.solicitud.update({
      where: { id },
      data: {
        estado: 'APROBADA',
        datosJSON: datosActualizados,
      },
    });

    // La credencial se emite a nombre de la institución autenticada que aprueba
    // la solicitud (antes se ignoraba el parámetro y se usaba siempre
    // "Registro Civil del Ecuador" como institución fija).
    const emitidaEn = new Date();
    const firmaEmisorHash = calcularFirmaEmisorHash({
      institucionId: institucion.id,
      usuarioId: solicitud.usuarioId,
      hashBlockchain: privateKey,
      emitidaEn,
    });
    const credencial = await this.prisma.credencial.create({
      data: {
        titulo,
        descripcion: 'Emisión de identidad oficial',
        usuarioId: solicitud.usuarioId,
        institucionId: institucion.id,
        solicitudId: solicitud.id,
        hashBlockchain: privateKey,
        emitidaEn,
        fechaCaducidad: calcularFechaCaducidad(emitidaEn),
        firmaEmisorHash,
      },
    });

    // Notificación + email al ciudadano son "best effort": si fallan, no deben
    // afectar la respuesta HTTP de approve() (la credencial ya fue emitida).
    const ciudadano = await this.prisma.usuario.findUnique({
      where: { id: solicitud.usuarioId },
    });
    await this.notificationsService.crear(
      solicitud.usuarioId,
      'Identidad aprobada',
      `Tu identidad (${titulo}) fue aprobada por ${institucion.nombre}`,
    );
    if (ciudadano) {
      await this.mailService.enviar(
        ciudadano.email,
        'Tu identidad fue aprobada',
        `<p>Hola ${ciudadano.nombre},</p><p>Tu identidad (<strong>${titulo}</strong>) fue aprobada por ${institucion.nombre}.</p>`,
      );
    }

    return {
      message: 'Solicitud aprobada y credencial en proceso de emisión',
      solicitudId: id,
      credencialId: credencial.id,
      clavePrivadaAsignada: privateKey,
      cedulaAsociada: cedula,
    };
  }

  async reject(id: number, institucionId: number, motivo?: string) {
    const solicitud = await this.prisma.solicitud.findUnique({ where: { id } });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    if (solicitud.estado !== 'PENDIENTE')
      throw new BadRequestException('La solicitud ya fue procesada');

    // Mismo patrón que approve(): solo la institución elegida por el
    // ciudadano al solicitar puede rechazar la solicitud.
    if (solicitud.institucionId !== institucionId) {
      throw new ForbiddenException(
        'Esta solicitud fue dirigida a otra institución',
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

    await this.prisma.solicitud.update({
      where: { id },
      data: { estado: 'RECHAZADA' },
    });

    const titulo = TITULO_POR_TIPO[solicitud.tipoCredencial];
    const mensaje = motivo
      ? `Tu solicitud de identidad (${titulo}) fue rechazada por ${institucion.nombre}. Motivo: ${motivo}`
      : `Tu solicitud de identidad (${titulo}) fue rechazada por ${institucion.nombre}`;

    // Notificación + email son "best effort", igual que en approve().
    const ciudadano = await this.prisma.usuario.findUnique({
      where: { id: solicitud.usuarioId },
    });
    await this.notificationsService.crear(
      solicitud.usuarioId,
      'Identidad rechazada',
      mensaje,
    );
    if (ciudadano) {
      await this.mailService.enviar(
        ciudadano.email,
        'Tu solicitud de identidad fue rechazada',
        `<p>Hola ${ciudadano.nombre},</p><p>${mensaje}</p>`,
      );
    }

    return {
      message: 'Solicitud rechazada',
      solicitudId: id,
    };
  }

  async findByUsuario(usuarioId: number) {
    return this.prisma.solicitud.findMany({
      where: { usuarioId },
      include: { institucion: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
