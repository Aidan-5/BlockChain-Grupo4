import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('notificaciones')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAllForUser(@Req() req: { user: JwtPayload }) {
    return this.notificationsService.findAllForUser(req.user.sub);
  }

  @Patch(':id/leida')
  @UseGuards(JwtAuthGuard)
  marcarLeida(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.notificationsService.marcarLeida(+id, req.user.sub);
  }
}
