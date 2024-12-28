// src/signin/signin.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SigninController } from './signin.controller';
import { SigninService } from './signin.service';
import { User, UserSchema } from '../signup/schemas/signup.schema';
import { AuthModule } from '../auth/auth.module'; 

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule, 
  ],
  controllers: [SigninController],
  providers: [SigninService],
})
export class SigninModule {}