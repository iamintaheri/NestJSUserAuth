import { Injectable } from '@nestjs/common';
import * as Kavenegar from 'kavenegar';
import * as config from 'config'

enum templates {
  'resetPassword' = 'resetCode',
  'signUp' = 'signUpVerify',
}

@Injectable()
export class SmsHelper {
  static template = templates;

  private static api = Kavenegar.KavenegarApi({
    apikey: config.get('kavenegarApi').token,
  });

  private static acceptStatus = [1, 10, 4, 5, 13];

  static async sendVerification(
    phone: string,
    value: string,
    template: string,
  ): Promise<any> {
    const result = await this.asyncWrapper(phone, value, template);
    return this.acceptStatus.includes(result[0]['status']);
  }

  private static asyncWrapper(phone: string, value: string, template: string) {
    return new Promise((resolve, reject) => {
      this.api.VerifyLookup(
        { receptor: phone, token: value, template: template },
        resolve,
      );
    });
  }
}
