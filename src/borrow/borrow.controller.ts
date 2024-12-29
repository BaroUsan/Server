import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
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
}
