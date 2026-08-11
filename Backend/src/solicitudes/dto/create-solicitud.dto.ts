import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { TipoIdentidad } from '@prisma/client';

export class CreateSolicitudDto {
  @IsEnum(TipoIdentidad)
  tipoCredencial: TipoIdentidad;

  @IsString()
  @IsNotEmpty()
  datosJSON: string;

  // La institución la elige el ciudadano en el formulario de solicitud
  // (a diferencia de usuarioId, que se deriva del JWT — ver SolicitudesController.create).
  @IsInt()
  institucionId: number;

  // usuarioId NO se acepta del cliente: se deriva del JWT del ciudadano
  // autenticado (ver SolicitudesController.create).
}
