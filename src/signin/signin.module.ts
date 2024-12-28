import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SigninController } from './signin.controller';
import { SigninService } from './signin.service';
import { User, UserSchema } from '../signup/schemas/signup.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [SigninController],
  providers: [SigninService],
})
export class SigninModule {}