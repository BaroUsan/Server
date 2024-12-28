import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SignupModule } from './signup/signup.module';
import * as dotenv from 'dotenv';

dotenv.config(); 

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    SignupModule,
  ],
})
export class AppModule {}