import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SigninDto } from './dto/signin.dto';
import { User, UserDocument } from '../signup/schemas/signup.schema';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class SigninService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly authService: AuthService,
  ) {}

  async signin(signinDto: SigninDto) {
    const user = await this.userModel.findOne({ email: signinDto.email });
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    const isPasswordValid = await bcrypt.compare(signinDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    const accessToken = await this.authService.generateAccessToken(user); 
    const refreshToken = await this.authService.generateRefreshToken(user);

    return { message: '로그인 성공', accessToken, refreshToken }; 
  }
}