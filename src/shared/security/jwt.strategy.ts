import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

const SECRET = process.env.JWT_SECRET!;
if (!SECRET) throw new Error('JWT_SECRET is not set');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: SECRET,
    });
  }

  async validate(payload: any) {
    return payload;
  }
}
