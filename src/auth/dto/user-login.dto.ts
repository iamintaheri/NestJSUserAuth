import { IsNotEmpty, Length, Matches } from 'class-validator';
export class UserLoginDto {
  @IsNotEmpty()
  @Length(11, 11)
  @Matches(/^(\+98|0)?9\d{9}$/, { message: 'Wrong phone format' })
  phone: string;

  @IsNotEmpty()
  @Length(8, 30)
  password: string;
}
