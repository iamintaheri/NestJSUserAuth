import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRegDto } from './dto/user-reg.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { UserVerifyDto } from './dto/user-verify.dto';
import { UserRepository } from './user.repository';
import { SmsHelper } from './sms.helper';
import { JwtService } from '@nestjs/jwt';
import { NotAcceptableException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { PhoneDto } from './dto/phone.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private jwtService: JwtService,
  ) {}

  async signUp(registerDto: UserRegDto) {
    const { phone } = registerDto;
    let user = await this.userRepo.findOne({
      phone: phone,
      is_verified: false,
    });
    if (user) user = await this.userRepo.signUpAgain(user, registerDto);
    else user = await this.userRepo.signUp(registerDto);

    // const result = await SmsHelper.sendVerification(
    //   phone,
    //   user.code.toString(),
    //   SmsHelper.template.signUp,
    // );
    // if (!result) throw new InternalServerErrorException('sms');

    await this.userRepo.setSentSmsDate(user);
    const payload = { phone, is_temp: true };
    return await this.jwtService.sign(payload);
  }

  async signIn(loginDto: UserLoginDto) {
    const { phone, password } = loginDto;
    const user = await this.userRepo.findOne({
      phone: phone,
      is_verified: true,
    });
    if (!user) throw new NotFoundException('user not found');

    if (!(await user.validatePassword(password)))
      throw new UnauthorizedException('invalid credentials');
    const payload = { phone };
    const token = await this.jwtService.sign(payload);

    return { token: token, user: user };
  }

  async verifyUser(userVerifyDto: UserVerifyDto, phone) {
    const { code } = userVerifyDto;
    const user = await this.userRepo.findOne({
      phone: phone,
      code: parseInt(code),
      is_verified: false,
    });
    if (!user) throw new NotAcceptableException('Wrong!');

    await this.userRepo.VerifyUser(user);
    const payload = { phone };
    const token = await this.jwtService.sign(payload);
    return { token: token, user: user };
  }

  async resendSms(phone: string) {
    const user = await this.userRepo.findOne({
      phone: phone,
      is_verified: false,
    });
    if (!user) throw new NotFoundException('User not found');

    const last_sms = DateTime.fromISO(user.last_sms.toJSON().replace('Z', ''), {
      zone: 'utc',
    });
    const { minutes } = DateTime.utc().diff(last_sms, 'minutes').toObject();
    if (minutes < 2) throw new ForbiddenException('Wait 2minutes!!');

    const new_code = (await this.userRepo.setVerifyCode(user)).code;
    // const result = await SmsHelper.sendVerification(
    //   phone,
    //   new_code.toString(),
    //   SmsHelper.template.signUp,
    // );
    // if (!result) throw new InternalServerErrorException('Failed SMS!');

    await this.userRepo.setSentSmsDate(user);
  }

  async forgotPassword(phoneDto: PhoneDto) {
    const { phone } = phoneDto;
    const user = await this.userRepo.findOne({
      phone: phone,
      is_verified: true,
    });
    if (!user) throw new NotFoundException('User not Found!');
    const newPass = this.genNewPass(10);
    await this.userRepo.setNewPass(user, newPass);
    console.log(newPass);
    // const result = await SmsHelper.sendVerification(
    //   phone,
    //   newPass,
    //   SmsHelper.template.resetPassword,
    // );
    //if (!result) throw new InternalServerErrorException('Failed SMS!');
  }

  async changePassword(resetPasswordDto: ResetPasswordDto, phone: string) {
    const { password, new_password } = resetPasswordDto;
    const user = await this.userRepo.findOne({
      phone: phone,
      is_verified: true,
    });
    if (!user) throw new NotAcceptableException('User not Found!');
    if (!(await user.validatePassword(password)))
      throw new ForbiddenException('Wrong Password Given');
    await this.userRepo.setNewPass(user, new_password);
  }

  genNewPass(length = 10): string {
    const characters =
      '@ABCDEFGHJKMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_';
    let result = ' ';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result.replace(/\s/g, '');
  }
}
