import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../signup/schemas/signup.schema';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(user: User) {
    return this.jwtService.sign({ email: user.email, name: user.name });
  }

  async generateRefreshToken(user: User) {
    return this.jwtService.sign({ email: user.email, name: user.name }, { expiresIn: '7d' });
  }
}