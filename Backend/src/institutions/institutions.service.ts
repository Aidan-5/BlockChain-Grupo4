import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { Prisma, Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InstitutionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInstitutionDto) {
    const { email, password, nombre, tipo, wallet } = data;

    const existing = await this.prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.$transaction(async (tx) => {
      const institucion = await tx.institucion.create({
        data: { nombre, tipo, wallet },
      });

      const usuario = await tx.usuario.create({
        data: {
          nombre,
          email,
          password: hashedPassword,
          rol: 'INSTITUCION',
          institucionId: institucion.id,
        },
      });

      return {
        institucion,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      };
    });
  }

  // Rol del usuario autenticado que consulta el listado: CIUDADANO solo debe
  // ver instituciones activas (para elegir una al solicitar una identidad);
  // ADMIN/INSTITUCION ven todas (activas e inactivas) para poder gestionarlas.
  async findAll(rolSolicitante?: Rol) {
    const instituciones = await this.prisma.institucion.findMany({
      where: rolSolicitante === 'CIUDADANO' ? { activo: true } : undefined,
      include: {
        credenciales: { select: { usuarioId: true } },
        atributos: { select: { atributo: true } },
      },
    });

    return instituciones.map(({ credenciales, atributos, ...institucion }) => ({
      ...institucion,
      usuariosRegistrados: new Set(credenciales.map((c) => c.usuarioId)).size,
      atributos: atributos.map((a) => a.atributo),
    }));
  }

  async findOne(id: number) {
    const institucion = await this.prisma.institucion.findUnique({
      where: { id },
      include: {
        atributos: { select: { atributo: true } },
      },
    });

    if (!institucion) {
      return institucion;
    }

    const { atributos, ...rest } = institucion;
    return { ...rest, atributos: atributos.map((a) => a.atributo) };
  }

  async update(id: number, data: UpdateInstitutionDto) {
    const { activo, atributos, ...rest } = data;

    return this.prisma.$transaction(async (tx) => {
      const institucion = await tx.institucion.update({
        where: { id },
        data: { ...rest, ...(activo !== undefined ? { activo } : {}) },
      });

      // Mantiene sincronizado el bloqueo de login del Usuario (rol INSTITUCION)
      // vinculado con el estado activo/inactivo de la institución.
      if (activo !== undefined) {
        await tx.usuario.updateMany({
          where: { institucionId: id },
          data: { activo },
        });
      }

      // Reemplaza TODO el set de atributos de identidad de la institución
      // cuando viene en el body (el ADMIN selecciona del catálogo fijo, no
      // hace un merge incremental).
      if (atributos !== undefined) {
        await tx.institucionAtributo.deleteMany({
          where: { institucionId: id },
        });
        if (atributos.length > 0) {
          await tx.institucionAtributo.createMany({
            data: atributos.map((atributo) => ({
              institucionId: id,
              atributo,
            })),
          });
        }
      }

      return institucion;
    });
  }

  async remove(id: number) {
    // Elimina también la cuenta de acceso (Usuario rol INSTITUCION) vinculada;
    // sin esto, el FK institucionId (ON DELETE SET NULL) dejaría esa cuenta
    // activa pero huérfana, capaz de loguearse con un institucionId nulo.
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.usuario.deleteMany({ where: { institucionId: id } });
        return tx.institucion.delete({ where: { id } });
      });
    } catch (err) {
      // P2003: la institución (o su cuenta vinculada) tiene credenciales,
      // solicitudes o notificaciones asociadas por FKs requeridas sin cascade
      // (son registros de identidad reales, no se borran en silencio).
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new BadRequestException(
          'No se puede eliminar esta institución porque tiene credenciales o solicitudes emitidas. Usa "Suspender" en su lugar.',
        );
      }
      throw err;
    }
  }
}
