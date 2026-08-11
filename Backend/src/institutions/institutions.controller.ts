import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { ATRIBUTOS_IDENTIDAD_CATALOGO } from './atributos-identidad';

@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() body: CreateInstitutionDto) {
    return this.institutionsService.create(body);
  }

  // Restringido a usuarios autenticados: ADMIN/INSTITUCION gestionan instituciones,
  // CIUDADANO necesita el catálogo para elegir institución al solicitar una
  // identidad (solo ve las activas, ver InstitutionsService.findAll). No público:
  // expone wallets.
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'INSTITUCION', 'CIUDADANO')
  findAll(@Req() req: { user: JwtPayload }) {
    return this.institutionsService.findAll(req.user.rol);
  }

  // Catálogo fijo de los 15 atributos de identidad (etiqueta + tipo) para que
  // el frontend renderice checkboxes/formularios sin duplicar la lista. Debe
  // registrarse ANTES de ':id': Nest resuelve rutas en orden y si no,
  // "atributos-catalogo" se interpretaría como un :id.
  @Get('atributos-catalogo')
  @UseGuards(JwtAuthGuard)
  getAtributosCatalogo() {
    return ATRIBUTOS_IDENTIDAD_CATALOGO;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'INSTITUCION', 'CIUDADANO')
  findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(Number(id));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: UpdateInstitutionDto) {
    return this.institutionsService.update(Number(id), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.institutionsService.remove(Number(id));
  }
}
