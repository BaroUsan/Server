import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MypageController } from './mypage.controller';
import { MypageService } from './mypage.service';
import { BorrowHistory, BorrowHistorySchema } from '../borrow/schemas/borrow-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BorrowHistory.name, schema: BorrowHistorySchema }
    ])
  ],
  controllers: [MypageController],
  providers: [MypageService]
})
export class MypageModule {}
