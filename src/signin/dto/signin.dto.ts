import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SigninDto {
  @ApiProperty({ description: '사용자의 이메일 주소' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '사용자의 비밀번호' })
  @IsNotEmpty()
  password: string;
}