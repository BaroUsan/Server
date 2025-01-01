import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SignupModule } from './signup/signup.module';
import { SigninModule } from './signin/signin.module';
import { AuthModule } from './auth/auth.module'; 
import { ConfigModule } from '@nestjs/config'; 
import { UmbModule } from './umb/umb.module';
import { BorrowModule } from './borrow/borrow.module';
import { MypageModule } from './mypage/mypage.module';

@Module({
  imports: [
    ConfigModule.forRoot(), 
    MongooseModule.forRoot(process.env.MONGODB_URI),
    SignupModule,
    SigninModule,
    AuthModule,
    UmbModule,
    BorrowModule,
    MypageModule,
  ],
})
export class AppModule {}