import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  // institucionId NUNCA viene del body: se deriva del JWT de la cuenta
  // INSTITUCION autenticada, para que una institución no pueda emitir
  // credenciales a nombre de otra.
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTITUCION')
  create(@Body() body: CreateCredentialDto, @Req() req: { user: JwtPayload }) {
    return this.credentialsService.create(body, req.user.institucionId!);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTITUCION')
  findAll(@Req() req: { user: JwtPayload }) {
    return this.credentialsService.findAll(req.user.institucionId);
  }

  // Verificación pública de credenciales: sin guard a propósito (lo consume
  // Frontend/src/pages/Verifier.tsx sin sesión iniciada).
  @Get(':id/verify')
  verify(@Param('id') id: string) {
    return this.credentialsService.verify(Number(id));
  }

  // Acceso propio: el ciudadano titular puede ver sus credenciales.
  // INSTITUCION puede ver las credenciales de cualquier usuario.
  @Get('usuario/:userId')
  @UseGuards(JwtAuthGuard)
  findByUser(
    @Param('userId') userId: string,
    @Req() req: { user: JwtPayload },
  ) {
    const targetId = Number(userId);
    const { user } = req;

    if (user.rol !== 'INSTITUCION' && user.sub !== targetId) {
      throw new ForbiddenException('No tienes acceso a estas credenciales');
    }

    return this.credentialsService.findByUser(targetId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('INSTITUCION')
  findOne(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.credentialsService.findOne(Number(id), req.user.institucionId);
  }
}
