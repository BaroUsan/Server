import { Module } from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { BorrowController } from './borrow.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Status, StatusSchema } from './schemas/status.schema';
import { User, UserSchema } from './schemas/user.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: Status.name, schema: StatusSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [BorrowController],
  providers: [BorrowService],
})
export class BorrowModule {}
