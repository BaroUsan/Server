import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SignupDto } from './dto/signup.dto';
import { User, UserDocument } from './schemas/signup.schema';

@Injectable()
export class SignupService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async signup(signupDto: SignupDto) {
    const emailDomain = signupDto.email.split('@')[1];
    if (emailDomain !== 'bssm.hs.kr') {
      throw new BadRequestException('bssm.hs.kr 학교 이메일만 회원가입이 가능합니다.'); 
    }

    const existingUser = await this.userModel.findOne({ email: signupDto.email });
    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const createdUser = new this.userModel(signupDto);
    await createdUser.save();
    return { message: '회원가입 성공', user: createdUser };
  }
}