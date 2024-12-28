import { Module } from '@nestjs/common';
import { UmbController } from './umb.controller';
import { UmbService } from './umb.service';

@Module({
  controllers: [UmbController],
  providers: [UmbService]
})
export class UmbModule {}
