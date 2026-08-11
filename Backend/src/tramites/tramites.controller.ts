import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TramitesService } from './tramites.service';
import { CreateTramiteDto } from './dto/create-tramite.dto';
import { UpdateTramiteDto } from './dto/update-tramite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('institutions/:institucionId/tramites')
export class TramitesController {
  constructor(private readonly tramitesService: TramitesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(
    @Param('institucionId') institucionId: string,
    @Body() body: CreateTramiteDto,
  ) {
    return this.tramitesService.create(Number(institucionId), body);
  }

  // Cualquier usuario autenticado (CIUDADANO incluido) puede ver los trámites
  // activos de una institución, para saber qué puede hacer si tiene una
  // credencial vigente emitida por ella.
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Param('institucionId') institucionId: string) {
    return this.tramitesService.findActivosByInstitucion(Number(institucionId));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('institucionId') institucionId: string,
    @Param('id') id: string,
    @Body() body: UpdateTramiteDto,
  ) {
    return this.tramitesService.update(Number(institucionId), Number(id), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(
    @Param('institucionId') institucionId: string,
    @Param('id') id: string,
  ) {
    return this.tramitesService.remove(Number(institucionId), Number(id));
  }
}
