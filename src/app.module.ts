import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SignupModule } from './signup/signup.module';
import { SigninModule } from './signin/signin.module';
import { AuthModule } from './auth/auth.module'; 
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    SignupModule,
    SigninModule,
    AuthModule,
  ],
})
export class AppModule {}