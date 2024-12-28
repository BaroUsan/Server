import { Controller, Get } from '@nestjs/common';
import { UmbService } from './umb.service';
import { ApiTags, ApiResponse } from '@nestjs/swagger'; 

@ApiTags('우산 여부') 
@Controller('umb')
export class UmbController {
  constructor(private readonly umbService: UmbService) {}

  @Get('status')
  @ApiResponse({ status: 200, description: 'Retrieve umbrella status.' }) 
  async getStatus() {
    return this.umbService.getStatus();
  }
}