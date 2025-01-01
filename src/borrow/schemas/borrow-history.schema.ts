import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class BorrowHistory extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: [Number], default: [] })
  borrowedUmbrellas: number[];

  @Prop({ required: true, default: Date.now })
  updatedAt: Date;
}

export const BorrowHistorySchema = SchemaFactory.createForClass(BorrowHistory); 