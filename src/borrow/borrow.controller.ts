import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BorrowService } from './borrow.service';

@ApiTags('borrow')
@Controller('borrow')
export class BorrowController {
  constructor(private readonly borrowService: BorrowService) {}

  @Get()
  @ApiOperation({ summary: '대여 서비스 정보 가져오기' })
  getBorrowInfo() {
    return { message: 'Borrow service information' };
  }

  @Get('status/borrowed')
  @ApiOperation({ summary: '현재 대여 중인 우산 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자별 대여 중인 우산 목록',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          email: { type: 'string', example: '2@bssm.hs.kr' },
          borrowedUmbrellas: { 
            type: 'array', 
            items: { type: 'number' },
            example: [1, 3] 
          }
        }
      }
    }
  })
  async getBorrowStatus() {
    return this.borrowService.getAllBorrowStatus();
  }

  @Get('status/umbrellas')
  @ApiOperation({ summary: '전체 우산 상태 조회' })
  @ApiResponse({
    status: 200,
    description: '우산 상태 배열 (0: 대여 중, 1: 보관 중)',
    schema: {
      type: 'array',
      items: { type: 'number' },
      example: [1, 0, 1, 1, 0]
    }
  })
  async getUmbrellaStatus() {
    return this.borrowService.getCurrentStatus();
  }
}
