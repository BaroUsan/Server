import { Injectable, OnModuleInit, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Status } from './schemas/status.schema';
import { User } from './schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { BorrowHistory } from './schemas/borrow-history.schema';
import { SerialPort } from 'serialport'; // SerialPort 수정
import { ReadlineParser } from '@serialport/parser-readline';

@Injectable()
export class BorrowService implements OnModuleInit {
  private serialPort: SerialPort;
  private parser: ReadlineParser;
  public lastRfidUser: string | null = null;
  private readonly logger = new Logger(BorrowService.name);
  private currentStatus: number[] = [];

  constructor(
    @InjectModel(Status.name) private statusModel: Model<Status>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(BorrowHistory.name) private borrowHistoryModel: Model<BorrowHistory>,
    private configService: ConfigService,
  ) {
    // 수정: SerialPort 초기화 방법 변경
    const serialPortOptions = {
      path: '/dev/ttyUSB0', // 시리얼 포트 경로
      baudRate: 115200,      // 보드 레이트
    };

    this.serialPort = new SerialPort(serialPortOptions); // 옵션 객체 사용

    this.parser = this.serialPort.pipe(new ReadlineParser());

    this.serialPort.on('open', () => {
      this.logger.log('시리얼 포트가 열렸습니다');
    });

    this.serialPort.on('error', (error) => {
      this.logger.error('시리얼 통신 오류:', error);
    });

    this.parser.on('data', async (data: string) => {
      this.logger.log('시리얼 데이터 수신:', data);
      try {
        await this.handleRfidData(data);
      } catch (error) {
        this.logger.error('데이터 처리 중 오류 발생:', error);
      }
    });
  }

  async onModuleInit() {
    try {
      const statusDocs = await this.statusModel.find()
        .sort({ umbrellaNumber: 1 })
        .exec();
      this.currentStatus = statusDocs.map(doc => doc.status);

      this.logger.log('MongoDB에서 가져온 우산 상태:');
      statusDocs.forEach(doc => {
        this.logger.log(`우산 ${doc.umbrellaNumber}번: 상태=${doc.status}`);
      });

    } catch (error) {
      this.logger.error('초기 상태 로드 중 오류:', error.message);
      throw error;
    }
  }

  private async sendSerialData(data: string) {
    return new Promise((resolve, reject) => {
      this.serialPort.write(data, (error) => {
        if (error) {
          this.logger.error('시리얼 데이터 전송 오류:', error);
          reject(error);
        } else {
          this.logger.log('시리얼 데이터 전송 성공:', data);
          resolve(true);
        }
      });
    });
  }

  private checkRfidMatch(receivedRfid: string): boolean {
    const rfidMap = {
      '174112147238': '2023042@bssm.hs.kr',
      '109000052096': '2023009@bssm.hs.kr',
      '172184247114': '2023048@bssm.hs.kr',
      '044199227113': '2@bssm.hs.kr',
      '158017134238': '2023043@bssm.hs.kr'
    };
    
    const trimmedRfid = receivedRfid.trim();
    if (rfidMap[trimmedRfid]) {
      this.lastRfidUser = rfidMap[trimmedRfid];
      return true;
    }
    return false;
  }

  private async handleRfidData(data: string) {
    if (this.checkRfidMatch(data)) {
      const user = await this.userModel.findOne({ email: this.lastRfidUser }).exec();

      if (user) {
        this.logger.log(`RFID 인증 성공! 사용자: ${this.lastRfidUser}`);

        // 사용자의 대여 이력 확인
        const borrowHistory = await this.borrowHistoryModel.findOne({ email: this.lastRfidUser }).exec();

        if (borrowHistory && borrowHistory.borrowedUmbrellas && borrowHistory.borrowedUmbrellas.length > 0) {
          // 빌린 우산이 있으면 반납 처리
          const umbrellaToReturn = borrowHistory.borrowedUmbrellas[0];
          await this.returnUmbrella(this.lastRfidUser);
        }
      } else {
        this.logger.warn(`RFID 인증 실패: 사용자 ${this.lastRfidUser}가 존재하지 않습니다`);
        this.lastRfidUser = null;
      }
    } else {
      this.logger.warn(`RFID 인증 실패: ${data}`);
    }
  }

  private async checkOverdueStatus(email: string) {
    const history = await this.borrowHistoryModel.findOne({ email });
    if (!history) return;

    const now = new Date();
    const overdue: number[] = [];

    history.borrowedUmbrellas.forEach(umbrellaNumber => {
      const dueDate = history.dueDates?.get(umbrellaNumber.toString());
      if (dueDate && now > dueDate) {
        overdue.push(umbrellaNumber);
      }
    });

    await this.borrowHistoryModel.updateOne(
      { email },
      { $set: { overdueUmbrellas: overdue } }
    );
  }

  async borrowUmbrella(email: string, umbrellaNumber: number) {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }

      if (this.currentStatus[umbrellaNumber - 1] === 0) {
        throw new BadRequestException('이미 대여 중인 우산입니다');
      }

      const borrowDate = new Date();
      const dueDate = new Date(borrowDate);
      dueDate.setDate(dueDate.getDate() + 3);

      // 시리얼 통신으로 우산 번호만 전송
      try {
        await this.sendSerialData(umbrellaNumber.toString());
      } catch (error) {
        this.logger.error('우산 번호 전송 실패:', error);
        throw new BadRequestException('우산 대여 시스템과 통신 중 오류가 발생했습니다');
      }

      this.currentStatus[umbrellaNumber - 1] = 0;
      await this.statusModel.updateOne(
        { umbrellaNumber },
        { $set: { status: 0 } },
        { upsert: true }
      );

      await this.userModel.updateOne(
        { email },
        { $addToSet: { borrowedItems: umbrellaNumber } }
      );

      const borrowHistory = await this.borrowHistoryModel.findOneAndUpdate(
        { email },
        {
          $addToSet: { borrowedUmbrellas: umbrellaNumber },
          $set: {
            [`borrowDates.${umbrellaNumber}`]: borrowDate,
            [`dueDates.${umbrellaNumber}`]: dueDate,
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );

      await this.checkOverdueStatus(email);

      return {
        success: true,
        message: `${umbrellaNumber}번 우산이 성공적으로 대여되었습니다.`,
        email: email,
        umbrellaNumber: umbrellaNumber,
        borrowedUmbrellas: borrowHistory.borrowedUmbrellas,
        borrowDate: borrowDate,
        dueDate: dueDate,
        updatedAt: borrowHistory.updatedAt
      };
    } catch (error) {
      this.lastRfidUser = null;
      this.logger.error('우산 대여 중 오류:', error);
      throw error;
    }
  }

  async returnUmbrella(email: string, umbrellaNumber?: number) {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }

      const borrowHistory = await this.borrowHistoryModel.findOne({ email }).exec();
      if (!borrowHistory || !borrowHistory.borrowedUmbrellas || borrowHistory.borrowedUmbrellas.length === 0) {
        throw new BadRequestException('반납할 우산이 없습니다');
      }

      const umbrellaNumber = borrowHistory.borrowedUmbrellas[0];
      const dueDate = borrowHistory.dueDates?.get(umbrellaNumber.toString());
      const isOverdue = dueDate && new Date() > dueDate;

      try {
        await this.sendSerialData(umbrellaNumber.toString());
      } catch (error) {
        this.logger.error('우산 번호 전송 실패:', error);
        throw new BadRequestException('우산 반납 시스템과 통신 중 오류가 발생했습니다');
      }

      this.currentStatus[umbrellaNumber - 1] = 1;
      await this.statusModel.updateOne(
        { umbrellaNumber },
        { $set: { status: 1 } },
        { upsert: true }
      );

      await this.userModel.updateOne(
        { email },
        { $pull: { borrowedItems: umbrellaNumber } }
      );

      const updatedHistory = await this.borrowHistoryModel.findOneAndUpdate(
        { email },
        {
          $pull: {
            borrowedUmbrellas: umbrellaNumber,
            overdueUmbrellas: umbrellaNumber
          },
          $unset: {
            [`borrowDates.${umbrellaNumber}`]: "",
            [`dueDates.${umbrellaNumber}`]: ""
          },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );

      return {
        success: true,
        message: `${umbrellaNumber}번 우산이 성공적으로 반납되었습니다.${isOverdue ? ' (연체)' : ''}`,
        email: email,
        umbrellaNumber: umbrellaNumber,
        borrowedUmbrellas: updatedHistory?.borrowedUmbrellas || [],
        isOverdue: isOverdue,
        updatedAt: updatedHistory?.updatedAt || new Date()
      };
    } catch (error) {
      this.lastRfidUser = null;
      this.logger.error('우산 반납 중 오류:', error);
      throw error;
    }
  }
}