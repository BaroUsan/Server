import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class BorrowHistory extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: [Number], default: [] })
  borrowedUmbrellas: number[];

  @Prop({ type: Map, of: Date })
  borrowDates: Map<string, Date>;

  @Prop({ type: Map, of: Date })
  dueDates: Map<string, Date>;

  @Prop({ type: [Number], default: [] })
  overdueUmbrellas: number[];

  @Prop({ required: true, default: Date.now })
  updatedAt: Date;
}

export const BorrowHistorySchema = SchemaFactory.createForClass(BorrowHistory); 