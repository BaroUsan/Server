import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class BorrowHistory extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  umbrellaNumber: number;

  @Prop({ required: true, default: Date.now })
  borrowedAt: Date;
}

export const BorrowHistorySchema = SchemaFactory.createForClass(BorrowHistory); 