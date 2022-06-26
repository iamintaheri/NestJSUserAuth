import { UserRegDto } from './dto/user-reg.dto';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/mongodb';

export class UserRepository extends EntityRepository<User> {
  async signUp(registerDto: UserRegDto): Promise<User> {
    const { phone, password, name } = registerDto;
    const user = new User();
    user.phone = phone;
    user.name = name;
    const salt = await bcrypt.genSalt();
    user.password = await this.genHashedPassword(password, salt);
    user.salt = salt;
    user.code = this.genSmsCode(10000, 99999);

    try {
      await this.persistAndFlush(user);
      return user;
    } catch (error) {
      if (error.code == 11000)
        throw new ConflictException('phone already exists');
      else throw new InternalServerErrorException();
    }
  }

  private genHashedPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }

  private genSmsCode(min, max): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
