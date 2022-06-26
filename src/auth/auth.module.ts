import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { SmsHelper } from './sms.helper';

@Module({
  providers: [AuthService, SmsHelper, JwtStrategy],
  exports: [SmsHelper, JwtStrategy],
})
export class AuthModule {}
