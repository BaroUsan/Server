// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SignupModule } from './signup/signup.module';
import { SigninModule } from './signin/signin.module';
import { AuthModule } from './auth/auth.module'; 
import { ConfigModule } from '@nestjs/config'; 

@Module({
  imports: [
    ConfigModule.forRoot(), 
    MongooseModule.forRoot(process.env.MONGODB_URI),
    SignupModule,
    SigninModule,
    AuthModule,
  ],
})
export class AppModule {}