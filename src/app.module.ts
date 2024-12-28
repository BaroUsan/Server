import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SignupModule } from './signup/signup.module';
import { SigninModule } from './signin/signin.module';
import { UmbModule } from './umb/umb.module';
import { MypageModule } from './mypage/mypage.module';

@Module({
  imports: [SignupModule, SigninModule, UmbModule, MypageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
