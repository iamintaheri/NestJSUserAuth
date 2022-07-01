import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { PhoneDto } from './dto/phone.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserLoginDto } from './dto/user-login.dto';

import { UserVerifyDto } from './dto/user-verify.dto';
import { SmsHelper } from './sms.helper';
import { User } from './user.entity';
import { UserRepository } from './user.repository';

const repositoryMockFactory = () => ({
  findOne: jest.fn(),
  VerifyUser: jest.fn(),
  signUpAgain: jest.fn(),
  signUp: jest.fn(),
  setSentSmsDate: jest.fn(),
  setNewPass: jest.fn(),
});

const smsMockClass = () => ({
  sendVerification: jest.fn(),
});

const mockUser = { phone: '09', is_verified: false, name: 'amin', code: 123 };
const registerDto = {
  phone: mockUser.phone,
  name: 'amin',
  password: 'password',
};

describe('-- Auth Service --', () => {
  let authService: AuthService;
  let module: TestingModule;
  let userRepository;
  let smsHelper;
  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useFactory: repositoryMockFactory },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'token'),
          },
        },
        { provide: SmsHelper, useFactory: smsMockClass },
      ],
    }).compile();
    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    smsHelper = module.get<SmsHelper>(SmsHelper);
  });

  describe('SignUp user', () => {
    it('should reSignUp if user was registered before', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.signUpAgain.mockResolvedValue(mockUser);
      // jest
      //   .spyOn(SmsHelper, 'sendVerification')
      //   .mockImplementation(async () => true);
      await authService.signUp(registerDto);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        phone: mockUser.phone,
        is_verified: false,
      });
      expect(userRepository.signUpAgain).toHaveBeenCalledTimes(1);
      expect(userRepository.signUpAgain(mockUser, registerDto)).resolves.toBe(
        mockUser,
      );
      expect(userRepository.setSentSmsDate).toHaveBeenCalled();
    });

    it('should signUp new User', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.signUp.mockResolvedValue(mockUser);
      // jest
      //   .spyOn(SmsHelper, 'sendVerification')
      //   .mockImplementation(async () => true);
      await authService.signUp(registerDto);
      expect(userRepository.signUp).toHaveBeenCalledTimes(1);
      expect(userRepository.signUp(registerDto)).resolves.toBe(mockUser);
      expect(userRepository.setSentSmsDate).toHaveBeenCalled();
    });

    // it('should throw error because of failed SMS', async () => {
    // jest
    //   .spyOn(SmsHelper, 'sendVerification')
    //   .mockImplementation(async () => false);
    //   userRepository.findOne.mockResolvedValue(null);
    //   userRepository.signUp.mockResolvedValue(mockUser);
    // jest
    //   .spyOn(SmsHelper, 'sendVerification')
    //   .mockImplementation(async () => false);
    //   expect(authService.signUp(registerDto)).rejects.toThrowError('sms');
    // });
  });

  describe('Verify user', () => {
    it('should throw error if user not found ', () => {
      expect(userRepository.findOne).not.toHaveBeenCalled();
      userRepository.findOne.mockReturnValue(null);
      const userVerifyDto: UserVerifyDto = { code: '123' };
      expect(authService.verifyUser(userVerifyDto, '09')).rejects.toThrowError(
        'Wrong!',
      );
    });

    it('should update and return user if code is correct', () => {
      userRepository.findOne.mockReturnValue(mockUser);
      const userVerifyDto: UserVerifyDto = { code: '123' };
      let result = authService.verifyUser(userVerifyDto, '09');
      expect(result).resolves.toStrictEqual({ token: 'token', user: mockUser });
    });
  });

  describe('SignIn user', () => {
    it('should throw exception when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      expect(authService.signIn(new UserLoginDto())).rejects.toThrowError(
        'user not found',
      );
    });

    it('should throw exception for invalid credentials', () => {
      let user = new User();
      userRepository.findOne.mockResolvedValue(user);
      jest
        .spyOn(user, 'validatePassword')
        .mockImplementation(async () => false);
      expect(authService.signIn(new UserLoginDto())).rejects.toThrowError(
        'invalid credentials',
      );
    });

    it('should return token+detail for success', async () => {
      let user = new User();
      userRepository.findOne.mockResolvedValue(user);
      jest.spyOn(user, 'validatePassword').mockImplementation(async () => true);
      let result = await authService.signIn({
        phone: mockUser.phone,
        password: 'password344',
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        phone: mockUser.phone,
        is_verified: true,
      });
      expect(result).toStrictEqual({ token: 'token', user: user });
    });
  });

  describe('Forgot password', () => {
    it('should throw exception for user not found', () => {
      userRepository.findOne.mockResolvedValue(null);
      expect(authService.forgotPassword(new PhoneDto())).rejects.toThrowError(
        'User not Found!',
      );
    });

    // it('throw exception because of failed sms', () => {
    //   userRepository.findOne.mockResolvedValue(mockUser);
    //   jest
    //     .spyOn(authService, 'genNewPass')
    //     .mockImplementation(() => 'password123');
    //   userRepository.setNewPass.mockResolvedValue(true);
    //   jest
    //     .spyOn(SmsHelper, 'sendVerification')
    //     .mockImplementation(async () => false);
    //   expect(authService.forgotPassword(new PhoneDto())).rejects.toThrowError(
    //     'Failed SMS!',
    //   );
    // });

    it('should change password successfully', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      jest
        .spyOn(authService, 'genNewPass')
        .mockImplementation(() => 'password123');
      userRepository.setNewPass.mockResolvedValue(true);
      // jest
      //   .spyOn(SmsHelper, 'sendVerification')
      //   .mockImplementation(async () => true);
      await authService.forgotPassword({ phone: mockUser.phone });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        phone: mockUser.phone,
        is_verified: true,
      });
      expect(userRepository.setNewPass).toHaveBeenCalledWith(
        mockUser,
        'password123',
      );
    });
  });

  describe('Reset Password', () => {
    it('should throw exception for user not found', () => {
      userRepository.findOne.mockResolvedValue(null);
      expect(
        authService.changePassword(new ResetPasswordDto(), mockUser.phone),
      ).rejects.toThrowError('User not Found!');
    });

    it('should throw exception for invalid credentials', () => {
      let user = new User();
      userRepository.findOne.mockResolvedValue(user);
      jest
        .spyOn(user, 'validatePassword')
        .mockImplementation(async () => false);
      expect(
        authService.changePassword(new ResetPasswordDto(), '09'),
      ).rejects.toThrowError('Wrong Password Given');
    });

    it('should change password correctly', async () => {
      let user = new User();
      userRepository.findOne.mockResolvedValue(user);
      userRepository.setNewPass.mockResolvedValue(true);
      jest.spyOn(user, 'validatePassword').mockImplementation(async () => true);
      const resestDto: ResetPasswordDto = {
        new_password: 'password123',
        confirm_password: 'password123',
        password: 'password345',
      };
      await authService.changePassword(resestDto, mockUser.phone);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        phone: mockUser.phone,
        is_verified: true,
      });
      expect(userRepository.setNewPass).toHaveBeenCalledWith(
        user,
        resestDto.new_password,
      );
    });
  });
});
