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

  onModuleInit() {
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

  private checkRfidMatch(message: Buffer): boolean {
    const rfidPattern = "0x23 0x24 0x24 0xC6";
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
    this.logger.log(`상태 데이터 수신: ${message.toString()}`);
    if (!this.lastRfidUser) {
      this.logger.warn('RFID 인증된 사용자가 없습니다');
      return;
    }

    try {
      const newStatus = message.toString().split(',').map(Number);
      this.logger.log(`파싱된 상태 업데이트: ${newStatus.join(',')}`);
      
      const currentStatus = await this.statusModel.findOne().exec();
      if (!currentStatus) {
        this.logger.warn('현재 상태 정보를 찾을 수 없습니다');
        return;
      }

      const changes = this.findStatusChanges(currentStatus.status, newStatus);
      if (changes.length > 0) {
        const user = await this.userModel.findOne({ email: this.lastRfidUser }).exec();
        if (!user) {
          this.logger.warn(`사용자를 찾을 수 없습니다: ${this.lastRfidUser}`);
          return;
        }

        for (const change of changes) {
          const umbrellaNumber = change.index + 1; 
          
          if (change.newValue === 1) { 
            await this.userModel.updateOne(
              { email: this.lastRfidUser },
              { $pull: { borrowedItems: umbrellaNumber } }
            ).exec();
            this.logger.log(`사용자 ${user.email}가 ${umbrellaNumber}번 우산을 반납했습니다`);
          } else { 
            await this.userModel.updateOne(
              { email: this.lastRfidUser },
              { $addToSet: { borrowedItems: umbrellaNumber } }
            ).exec();
            this.logger.log(`사용자 ${user.email}가 ${umbrellaNumber}번 우산을 대여했습니다`);
          }
        }

        await this.statusModel.updateOne({}, { status: newStatus }).exec();
        
        const updatedUser = await this.userModel.findOne({ email: this.lastRfidUser }).exec();
        this.logger.log(`사용자의 현재 대여 중인 우산: ${updatedUser.borrowedItems.join(', ')}번`);
      } else {
        this.logger.log('상태 변경사항이 없습니다');
      }
    } catch (error) {
      this.logger.error('상태 메시지 처리 중 오류 발생:', error);
    } finally {
      this.lastRfidUser = null;
    }
  }

  private findStatusChanges(oldStatus: number[], newStatus: number[]) {
    const changes = [];
    for (let i = 0; i < oldStatus.length; i++) {
      if (oldStatus[i] !== newStatus[i]) {
        changes.push({
          index: i,
          oldValue: oldStatus[i],
          newValue: newStatus[i]
        });
      }
    }
    return changes;
  }
}