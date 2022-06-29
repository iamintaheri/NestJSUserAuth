import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user-login.dto';
import { UserRegDto } from './dto/user-reg.dto';
import * as config from 'config';
import { UserVerifyDto } from './dto/user-verify.dto';
import { PhoneDto } from './dto/phone.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signUp')
  @HttpCode(201)
  async signUp(@Body(ValidationPipe) registerDto: UserRegDto, @Req() req) {
    const token = await this.authService.signUp(registerDto);
    const expireSeconds = config.get('jwt.expiresIn');
    // req.res.setHeader(
    //   'Set-Cookie',
    //   `${token};HttpOnly;Max-Age=${expireSeconds};SameSite=None;Secure`,
    // );
    req.res.setHeader(
      'Set-Cookie',
      `${token};HttpOnly;Max-Age=${expireSeconds};SameSite=None;`,
    );
  }

  @Post('/signIn')
  async singIn(
    @Body(ValidationPipe) loginDto: UserLoginDto,
    @Req() req: Request,
  ) {
    const data = await this.authService.signIn(loginDto);
    const expireSeconds = config.get('jwt.expiresIn');
    req.res.setHeader(
      'Set-Cookie',
      `${data.token};HttpOnly;Max-Age=${expireSeconds};Path=/;SameSite=None;`,
    );
    // req.res.setHeader(
    //   'Set-Cookie',
    //   `${data.token};HttpOnly;Max-Age=${expireSeconds};Path=/;SameSite=None;Secure`,
    // );
    return data.user;
  }

  @Get('/profile')
  @UseGuards(AuthGuard())
  profile(@Req() req) {
    return req.user;
  }

  @Post('/verify-user')
  @UseGuards(AuthGuard())
  async verifyUser(
    @Body(ValidationPipe) userVerifyDto: UserVerifyDto,
    @Req() req,
  ) {
    const data = await this.authService.verifyUser(
      userVerifyDto,
      req.user.phone,
    );
    const expireSeconds = config.get('jwt.expiresIn');
    // req.res.setHeader(
    //   'Set-Cookie',
    //   `${data.token};HttpOnly;Max-Age=${expireSeconds};Path=/;SameSite=None;Secure`,
    // );
    req.res.setHeader(
      'Set-Cookie',
      `${data.token};HttpOnly;Max-Age=${expireSeconds};Path=/;SameSite=None;`,
    );
    return data.user;
  }

  @Post('/resend-code')
  @UseGuards(AuthGuard())
  async resendSms(@Req() req) {
    return this.authService.resendSms(req.user.phone);
  }

  @Post('/forgot-password')
  async forgotPass(@Body(ValidationPipe) phoneDto: PhoneDto) {
    return this.authService.forgotPassword(phoneDto);
  }

  @Post('/change-password')
  @UseGuards(AuthGuard())
  async resetPass(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
    @Req() req,
  ) {
    return this.authService.changePassword(resetPasswordDto, req.user.phone);
  }

  @Get('/logout')
  @UseGuards(AuthGuard())
  async logout(@Req() req) {
    // req.res.setHeader(
    //   'Set-Cookie',
    //   `=${req.headers['cookie']};HttpOnly;Max-Age=0;Path=/;SameSite=None;Secure`,
    // );
    req.res.setHeader(
      'Set-Cookie',
      `=${req.headers['cookie']};HttpOnly;Max-Age=0;Path=/;SameSite=None;`,
    );
  }
}
