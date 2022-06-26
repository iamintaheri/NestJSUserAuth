import { IsNotEmpty, Length } from 'class-validator';
export class UserVerifyDto {
  @IsNotEmpty()
  @Length(5, 5)
  code: string;
}
