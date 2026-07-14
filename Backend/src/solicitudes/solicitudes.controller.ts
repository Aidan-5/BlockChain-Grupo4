import { Controller, Post, Get, Body, Param, Put } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  create(@Body() body: any) {
    return this.solicitudesService.create(body);
  }

  @Get('pendientes')
  findAllPending() {
    return this.solicitudesService.findAllPending();
  }

  @Get('usuario/:id')
  findByUsuario(@Param('id') id: string) {
    return this.solicitudesService.findByUsuario(+id);
  }

  @Put(':id/aprobar')
  approve(@Param('id') id: string, @Body('institucionId') institucionId: number) {
    return this.solicitudesService.approve(+id, institucionId);
  }
}
