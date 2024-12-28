import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StatusDocument = Status & Document;

@Schema()
export class Status {
  @Prop({ required: true })
  umbrellaNumber: number;

  @Prop({ required: true })
  status: number; 

  @Prop() 
  startDate?: Date;

  @Prop() 
  endDate?: Date;
}

export const StatusSchema = SchemaFactory.createForClass(Status);