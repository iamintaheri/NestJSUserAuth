import { IsNotEmpty, Length, Matches } from 'class-validator';
export class PhoneDto {
  @IsNotEmpty()
  @Length(11, 11)
  @Matches(/^(\+98|0)?9\d{9}$/, { message: 'Wrong phone format' })
  phone: string;
}
