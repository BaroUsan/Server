import { Controller, Get } from '@nestjs/common';
import { UmbService } from './umb.service';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger'; 

@ApiTags('우산 여부') 
@Controller('umb')
export class UmbController {
  constructor(private readonly umbService: UmbService) {}

  @Get('status')
  @ApiOperation({ 
    summary: '우산 상태 조회',
    description: '현재 대여 가능한 우산의 상태를 조회합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '우산 상태 조회 성공',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          umbrellaNumber: { type: 'number' },
          status: { type: 'number' }
        }
      }
    }
  }) 
  async getStatus() {
    return this.umbService.getStatus();
  }
} 