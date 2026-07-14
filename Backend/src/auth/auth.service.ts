import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(data: any) {
    const { nombre, email, password, identificacion, codigoSecreto } = data;
    
    const existing = await this.prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const rol = codigoSecreto === 'ADMIN_SSI_2026' ? 'ADMIN' : 'CIUDADANO';

    const user = await this.prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        identificacion: identificacion || null,
        rol
      }
    });

    return {
      message: 'Usuario registrado exitosamente',
      rol: user.rol
    };
  }

  async login(data: any) {
    const { email, password } = data;
    
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Allow fallback to default plain text passwords for existing seeded users during transition
      if (password !== user.password) {
        throw new UnauthorizedException('Credenciales inválidas');
      }
    }

    const payload = { sub: user.id, email: user.email, rol: user.rol };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    };
  }
}
