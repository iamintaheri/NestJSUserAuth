import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UserRepository } from './user.repository';
import * as config from 'config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userRepo: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromHeader('cookie'),
      secretOrKey: config.get('jwt').secret,
    });
  }

  async validate(payload): Promise<any> {
    const { phone, is_temp } = payload;
    if (is_temp !== undefined && is_temp)
      return { force_verification: true, phone: phone };

    const user = await this.userRepo.findOne({
      phone: phone,
      is_verified: true,
    });

    if (!user) throw new UnauthorizedException('invalid user');

    return user;
  }
}
