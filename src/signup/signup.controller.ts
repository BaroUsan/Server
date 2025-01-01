import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBody, ApiOperation } from '@nestjs/swagger';
import { SignupDto } from './dto/signup.dto';
import { SignupService } from './signup.service';

@ApiTags('인증/인가') 
@Controller('signup')
export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  @Post()
  @ApiOperation({ summary: '회원가입' })
  @ApiBody({ 
    type: SignupDto, 
    description: '회원가입 정보', 
  })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async signup(@Body() signupDto: SignupDto) {
    return this.signupService.signup(signupDto);
  }
}