import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Status } from './schemas/status.schema';
import { User } from './schemas/user.schema';
import * as mqtt from 'mqtt';
import { ConfigService } from '@nestjs/config';
import { MqttClient } from 'mqtt';

@Injectable()
export class BorrowService implements OnModuleInit {
  private client: MqttClient;
  private lastRfidUser: string | null = null;
  private readonly logger = new Logger(BorrowService.name);
  private currentStatus: number[] = [];

  constructor(
    @InjectModel(Status.name) private statusModel: Model<Status>,
    @InjectModel(User.name) private userModel: Model<User>,
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
        this.logger.log(
          `우산 ${doc.umbrellaNumber}번: ` +
          `상태=${doc.status}, ` 

        );
      });

    } catch (error) {
      this.logger.error('초기 상태 로드 중 오류:', error.message);
      throw error; 
    }

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
        } else if (topic === statusTopic) {
          await this.handleStatusMessage(message);
        }
      } catch (error) {
        this.logger.error('메시지 처리 중 오류 발생:', error);
      }
    });
  }

  async getAllBorrowStatus() {
    try {
      const users = await this.userModel
        .find({ 
          borrowedItems: { 
            $exists: true, 
            $ne: [] 
          }
        })
        .select('email borrowedItems -_id')
        .lean()
        .exec();

      return users.map(user => ({
        email: user.email,
        borrowedUmbrellas: user.borrowedItems
      }));
    } catch (error) {
      this.logger.error('대여 상태 조회 중 오류:', error);
      throw error;
    }
  }

  async getCurrentStatus() {
    try {
      return this.currentStatus;
    } catch (error) {
      this.logger.error('우산 상태 조회 중 오류:', error);
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

  private async handleStatusMessage(message: Buffer) {
    if (!this.lastRfidUser) {
      this.logger.warn('RFID 인증된 사용자가 없습니다');
      return;
    }

    try {
      const newStatus = message
        .toString()
        .split(',')
        .map((val) => parseInt(val.trim(), 10))
        .filter((val) => !isNaN(val));

      this.logger.log(`새로 수신된 상태: [${newStatus.join(', ')}]`);
      this.logger.log(`현재 저장된 상태: [${this.currentStatus.join(', ')}]`);

      const changes = [];
      for (let i = 0; i < Math.max(this.currentStatus.length, newStatus.length); i++) {
        const oldValue = this.currentStatus[i] ?? 1;
        const newValue = newStatus[i] ?? 1;
        
        if (oldValue !== newValue) {
          changes.push({ 
            umbrellaNumber: i + 1,
            oldValue,
            newValue,
            action: newValue === 0 ? '대여' : '반납'
          });
        }
      }

      if (changes.length === 0) {
        this.logger.log('상태 변경사항이 없습니다');
        return;
      }

      for (const change of changes) {
        this.logger.log(
          `우산 ${change.umbrellaNumber}번: ${change.action} ` +
          `(${change.oldValue} → ${change.newValue})`
        );

        if (change.newValue === 0) { 
          await this.userModel.updateOne(
            { email: this.lastRfidUser },
            { $addToSet: { borrowedItems: change.umbrellaNumber } }
          );
          this.logger.log(`${this.lastRfidUser}가 ${change.umbrellaNumber}번 우산을 대여했습니다`);
        } else { 
          await this.userModel.updateOne(
            { email: this.lastRfidUser },
            { $pull: { borrowedItems: change.umbrellaNumber } }
          );
          this.logger.log(`${this.lastRfidUser}가 ${change.umbrellaNumber}번 우산을 반납했습니다`);
        }
      }

      this.currentStatus = newStatus;

      await this.statusModel.updateOne(
        {},
        { $set: { status: newStatus } },
        { upsert: true }
      );

      const updatedUser = await this.userModel.findOne({ email: this.lastRfidUser }).exec();
      this.logger.log(
        `사용자의 현재 대여 중인 우산: ${
          updatedUser?.borrowedItems?.length > 0 
            ? updatedUser.borrowedItems.join(', ') + '번' 
            : '없음'
        }`
      );
    } catch (error) {
      this.logger.error('상태 메시지 처리 중 오류 발생:', error);
    }
  }
}