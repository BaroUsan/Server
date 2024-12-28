// src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { SigninModule } from '../signin/signin.module'; 

@Module({
  imports: [
    forwardRef(() => SigninModule), 
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret_key',
      signOptions: { expiresIn: '15m' }, 
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}