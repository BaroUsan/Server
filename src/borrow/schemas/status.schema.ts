import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Status extends Document {
  @Prop({ type: [Number], required: true })
  status: number[]; 

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const StatusSchema = SchemaFactory.createForClass(Status);

StatusSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});
