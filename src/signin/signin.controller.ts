import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBody, ApiOperation } from '@nestjs/swagger';
import { SigninDto } from './dto/signin.dto';
import { SigninService } from './signin.service';

@ApiTags('인증/인가') 
@Controller('signin')
export class SigninController {
  constructor(private readonly signinService: SigninService) {}

  @Post()
  @ApiOperation({ summary: '로그인', description: '이메일과 비밀번호로 로그인합니다.' })
  @ApiBody({ type: SigninDto, description: '로그인 정보' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '잘못된 이메일 또는 비밀번호' })
  async signin(@Body() signinDto: SigninDto) {
    return this.signinService.signin(signinDto); 
  }
}