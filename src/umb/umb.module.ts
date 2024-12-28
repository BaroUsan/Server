import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UmbController } from './umb.controller';
import { UmbService } from './umb.service';
import { Status, StatusSchema } from './schemas/status.schema'; 
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Status.name, schema: StatusSchema }]), 
    ConfigModule,
  ],
  controllers: [UmbController],
  providers: [UmbService],
})
export class UmbModule {}