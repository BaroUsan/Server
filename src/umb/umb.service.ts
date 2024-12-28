import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Status, StatusDocument } from './schemas/status.schema';
import { connect, IClientOptions, MqttClient } from 'mqtt'; 
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UmbService implements OnModuleInit {
  private mqttClient: MqttClient;

  constructor(
    @InjectModel(Status.name) private statusModel: Model<StatusDocument>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const options: IClientOptions = {
    };

    this.mqttClient = connect(this.configService.get('MQTT_BROKER_URL'), options);

    this.mqttClient.on('connect', () => {
      console.log('MQTT 브로커 연결 성공');
      this.mqttClient.subscribe(this.configService.get('MQTT_TOPIC'));
    });

    this.mqttClient.on('message', async (topic: string, message: Buffer) => {
      const statusArray = message.toString().split(',').map(Number);
      const today = new Date();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(today.getDate() + 3); 

      for (let i = 0; i < statusArray.length; i++) {
        const umbrellaNumber = i + 1;
        const status = statusArray[i];

        const updateData: any = { status }; 

        if (status === 1) {
          updateData.startDate = today; 
          updateData.endDate = threeDaysLater; 
        }

        await this.statusModel.updateOne(
          { umbrellaNumber },
          updateData,
          { upsert: true },
        );
      }
    });
  }

  async getStatus() {
    return this.statusModel.find().exec();
  }
}