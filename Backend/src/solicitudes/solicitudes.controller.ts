import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  ForbiddenException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  // usuarioId NUNCA viene del body: se deriva del JWT del ciudadano
  // autenticado, para que nadie cree solicitudes a nombre de otro usuario.
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CIUDADANO')
  create(@Body() body: CreateSolicitudDto, @Req() req: { user: JwtPayload }) {
    return this.solicitudesService.create(body, req.user.sub);
  }

  @Get('pendientes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTITUCION')
  findAllPending(@Req() req: { user: JwtPayload }) {
    return this.solicitudesService.findAllPending(req.user.institucionId!);
  }

  @Get('historial')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTITUCION')
  findAllHistory(@Req() req: { user: JwtPayload }) {
    return this.solicitudesService.findAllHistory(req.user.institucionId!);
  }

  // Acceso propio: el ciudadano titular puede ver sus propias solicitudes.
  // INSTITUCION puede ver las solicitudes de cualquier usuario.
  @Get('usuario/:id')
  @UseGuards(JwtAuthGuard)
  findByUsuario(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    const targetId = Number(id);
    const { user } = req;

    if (user.rol !== 'INSTITUCION' && user.sub !== targetId) {
      throw new ForbiddenException('No tienes acceso a estas solicitudes');
    }

    return this.solicitudesService.findByUsuario(targetId);
  }

  // institucionId se deriva de la institución autenticada que aprueba, no del
  // body (antes solicitudes.service.ts ignoraba el parámetro).
  @Put(':id/aprobar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTITUCION')
  approve(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.solicitudesService.approve(+id, req.user.institucionId!);
  }

  // institucionId se deriva de la institución autenticada, mismo patrón que aprobar().
  @Put(':id/rechazar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTITUCION')
  reject(
    @Param('id') id: string,
    @Body() body: { motivo?: string },
    @Req() req: { user: JwtPayload },
  ) {
    return this.solicitudesService.reject(
      +id,
      req.user.institucionId!,
      body?.motivo,
    );
  }
}
