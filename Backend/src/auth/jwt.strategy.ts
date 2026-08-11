import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Rol } from '@prisma/client';
import { JWT_SECRET } from './constants';

export interface JwtPayload {
  sub: number;
  email: string;
  rol: Rol;
  institucionId?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  // The returned value is attached to req.user
  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
