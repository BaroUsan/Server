import { Controller, Get } from '@nestjs/common';
import { UmbService } from './umb.service';

@Controller('umb')
export class UmbController {
  constructor(private readonly umbService: UmbService) {}

  @Get('status')
  async getStatus() {
    return this.umbService.getStatus();
  }
}