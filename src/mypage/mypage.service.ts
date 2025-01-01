import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BorrowHistory } from '../borrow/schemas/borrow-history.schema';

@Injectable()
export class MypageService {
  constructor(
    @InjectModel(BorrowHistory.name) private borrowHistoryModel: Model<BorrowHistory>,
  ) {}

  async getUserBorrowHistory(email: string) {
    const history = await this.borrowHistoryModel.findOne({ email }).exec();
    
    if (!history) {
      throw new NotFoundException('처음으로 우산을 빌린 후 마이페이지를 이용해주세요.');
    }

    return {
      email: history.email,
      borrowedUmbrellas: history.borrowedUmbrellas,
      borrowDates: Object.fromEntries(history.borrowDates || new Map()),
      dueDates: Object.fromEntries(history.dueDates || new Map()),
      overdueUmbrellas: history.overdueUmbrellas,
      updatedAt: history.updatedAt
    };
  }
}
