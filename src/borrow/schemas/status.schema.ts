import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StatusDocument = Status & Document;

@Schema()
export class Status {
  @Prop({ required: true })
  umbrellaNumber: number;

  @Prop({ required: true })
  status: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;
}

export const StatusSchema = SchemaFactory.createForClass(Status);