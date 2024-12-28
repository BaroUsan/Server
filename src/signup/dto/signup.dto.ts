import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ description: '사용자의 이메일 주소' }) 
  @IsEmail()
  email: string;

  @ApiProperty({ description: '사용자의 학번' }) 
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @ApiProperty({ description: '사용자의 이름' }) 
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '사용자의 비밀번호' })
  @IsNotEmpty()
  @IsString()
  password: string;
}