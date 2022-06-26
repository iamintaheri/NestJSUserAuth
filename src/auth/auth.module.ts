import { Module } from '@nestjs/common';
import { SmsHelper } from './sms.helper';

@Module({
  exports: [SmsHelper],
})
export class AuthModule {}
