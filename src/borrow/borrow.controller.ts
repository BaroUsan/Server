import { Controller, Post, Param, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BorrowService } from './borrow.service';

@ApiTags('borrow')
@Controller('borrow')
export class BorrowController {
  constructor(private readonly borrowService: BorrowService) {}

  @Post('borrow/:umbrellaNumber')
  @ApiOperation({ summary: '우산 대여하기' })
  @ApiResponse({
    status: 200,
    description: '우산 대여 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        email: { type: 'string' },
        umbrellaNumber: { type: 'number' },
        borrowedUmbrellas: { 
          type: 'array',
          items: { type: 'number' }
        },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  async borrowUmbrella(@Param('umbrellaNumber') umbrellaNumber: number) {
    if (!this.borrowService.lastRfidUser) {
      throw new UnauthorizedException('RFID 인증이 필요합니다');
    }
    return this.borrowService.borrowUmbrella(this.borrowService.lastRfidUser, umbrellaNumber);
  }

  @Post('return/:umbrellaNumber')
  @ApiOperation({ summary: '우산 반납하기' })
  @ApiResponse({
    status: 200,
    description: '우산 반납 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        email: { type: 'string' },
        umbrellaNumber: { type: 'number' },
        borrowedUmbrellas: { 
          type: 'array',
          items: { type: 'number' }
        },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  async returnUmbrella(@Param('umbrellaNumber') umbrellaNumber: number) {
    if (!this.borrowService.lastRfidUser) {
      throw new UnauthorizedException('RFID 인증이 필요합니다');
    }
    return this.borrowService.returnUmbrella(this.borrowService.lastRfidUser, umbrellaNumber);
  }
}
