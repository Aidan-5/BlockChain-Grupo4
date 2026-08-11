import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // No hay flujo público de creación directa de ciudadanos (eso lo cubre
  // /auth/register); esta vía queda para gestión operativa de la institución.
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTITUCION')
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTITUCION')
  findAll(@Req() req: { user: JwtPayload }) {
    return this.usersService.findAll(req.user.institucionId);
  }

  // Acceso propio: un CIUDADANO autenticado puede consultar SU PROPIO perfil.
  // INSTITUCION puede consultar cualquier perfil.
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    const targetId = Number(id);
    const { user } = req;

    if (user.rol !== 'INSTITUCION' && user.sub !== targetId) {
      throw new ForbiddenException('No tienes acceso a este perfil');
    }

    return this.usersService.findOne(targetId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTITUCION')
  update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(+id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTITUCION')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
