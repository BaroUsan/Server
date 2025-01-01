import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  email: string; 

  @Prop({ required: true })
  password: string;

  @Prop({ type: [Number], default: [] })
  borrowedItems: number[];

  @Prop({ required: true, unique: true })
  rfidNumber: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
