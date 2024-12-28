import { Injectable } from '@nestjs/common';
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
    const createdUser = new this.userModel(signupDto);
    await createdUser.save();
    return { message: '회원가입 성공', user: createdUser };
  }
}