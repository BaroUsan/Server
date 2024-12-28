import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SignupController } from './signup.controller';
import { SignupService } from './signup.service';
import { User, UserSchema } from './schemas/signup.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [SignupController],
  providers: [SignupService],
})
export class SignupModule {}