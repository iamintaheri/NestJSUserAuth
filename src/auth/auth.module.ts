import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { SmsHelper } from './sms.helper';
import { PassportModule } from '@nestjs/passport';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import * as config from 'config';
import { AuthController } from './auth.controller';

const jwtConf = config.get('jwt');
@Module({
  imports: [
    MikroOrmModule.forFeature({ entities: [User] }),
    JwtModule.register({
      secret: jwtConf.secret,
      signOptions: {
        expiresIn: jwtConf.expiresIn,
      },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SmsHelper, JwtStrategy],
  exports: [SmsHelper, JwtStrategy],
})
export class AuthModule {}
