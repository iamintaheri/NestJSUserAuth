import { IsNotEmpty, Length } from 'class-validator';
export class ResetPasswordDto {
  @IsNotEmpty()
  @Length(8, 30)
  password: string;

  @IsNotEmpty()
  @Length(8, 30)
  new_password: string;

  @IsNotEmpty()
  @Length(8, 30)
  confirm_password: string;
}
