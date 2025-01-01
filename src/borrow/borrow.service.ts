import { Injectable, OnModuleInit, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Status } from './schemas/status.schema';
import { User } from './schemas/user.schema';
import * as mqtt from 'mqtt';
import { ConfigService } from '@nestjs/config';
import { MqttClient } from 'mqtt';
import { BorrowHistory } from './schemas/borrow-history.schema';

@Injectable()
export class BorrowService implements OnModuleInit {
  private client: MqttClient;
  public lastRfidUser: string | null = null;
  private readonly logger = new Logger(BorrowService.name);
  private currentStatus: number[] = [];

  constructor(
    @InjectModel(Status.name) private statusModel: Model<Status>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(BorrowHistory.name) private borrowHistoryModel: Model<BorrowHistory>,
    private configService: ConfigService,
  ) {
    const brokerUrl = this.configService.get<string>('MQTT_BROKER_URL');
    this.client = mqtt.connect(brokerUrl, {
      clientId: `borrow_service_${Math.random().toString(16).slice(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    this.client.on('connect', () => {
      this.logger.log('MQTT 브로커에 연결되었습니다');
    });

    this.client.on('error', (error) => {
      this.logger.error('MQTT 연결 오류:', error);
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

      const rfidTopic = this.configService.get<string>('MQTT_TOPIC_RFID');
      const statusTopic = this.configService.get<string>('MQTT_TOPIC');

      this.client.subscribe(rfidTopic, (err) => {
        if (!err) {
          this.logger.log(`${rfidTopic} 토픽 구독 시작`);
        }
      });

      this.client.subscribe(statusTopic, (err) => {
        if (!err) {
          this.logger.log(`${statusTopic} 토픽 구독 시작`);
        }
      });

      this.client.on('message', async (topic, message) => {
        this.logger.log(`토픽 ${topic}에서 메시지 수신: ${message.toString()}`);
        try {
          if (topic === rfidTopic) {
            await this.handleRfidMessage(message);
          }
        } catch (error) {
          this.logger.error('메시지 처리 중 오류 발생:', error);
        }
      });

    } catch (error) {
      this.logger.error('초기 상태 로드 중 오류:', error.message);
      throw error;
    }
  }

  private checkRfidMatch(message: Buffer): boolean {
    const rfidPattern = '0x23 0x24 0x24 0xC6';
    const receivedMessage = message.toString().trim();
    this.logger.log(`RFID 패턴 비교 - 수신: "${receivedMessage}", 기대값: "${rfidPattern}"`);
    return receivedMessage === rfidPattern;
  }

  private async handleRfidMessage(message: Buffer) {
    if (this.checkRfidMatch(message)) {
      this.lastRfidUser = '2@bssm.hs.kr';
      const user = await this.userModel.findOne({ email: this.lastRfidUser }).exec();
      if (user) {
        this.logger.log(`RFID 인증 성공! 사용자: ${this.lastRfidUser}`);
      } else {
        this.logger.warn(`RFID 인증 실패: 사용자 ${this.lastRfidUser}가 존재하지 않습니다`);
        this.lastRfidUser = null;
      }
    } else {
      this.logger.warn(`RFID 인증 실패: ${message.toString()}`);
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

  async returnUmbrella(email: string, umbrellaNumber: number) {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다');
      }

      if (this.currentStatus[umbrellaNumber - 1] === 1) {
        throw new BadRequestException('이미 반납된 우산입니다');
      }

      const borrowHistory = await this.borrowHistoryModel.findOne({ email });
      const dueDate = borrowHistory?.dueDates?.get(umbrellaNumber.toString());
      const isOverdue = dueDate && new Date() > dueDate;

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