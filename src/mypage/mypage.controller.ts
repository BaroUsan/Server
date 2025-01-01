import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MypageService } from './mypage.service';

@ApiTags('마이페이지')
@Controller('mypage')
export class MypageController {
  constructor(private readonly mypageService: MypageService) {}

  @Get(':email')
  @ApiOperation({ 
    summary: '사용자 기록 조회',
    description: '이메일로 사용자의 우산 대여 기록을 조회합니다.'
  })
  @ApiParam({
    name: 'email',
    required: true,
    description: '조회할 사용자의 이메일 주소',
    example: '2@bssm.hs.kr'
  })
  @ApiResponse({
    status: 200,
    description: '사용자 대여 기록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        email: { 
          type: 'string',
          example: '2@bssm.hs.kr'
        },
        borrowedUmbrellas: { 
          type: 'array',
          items: { type: 'number' },
          example: [1, 3]
        },
        borrowDates: {
          type: 'object',
          additionalProperties: { type: 'string', format: 'date-time' },
          example: {
            "1": "2024-03-20T10:00:00.000Z",
            "3": "2024-03-21T14:30:00.000Z"
          }
        },
        dueDates: {
          type: 'object',
          additionalProperties: { type: 'string', format: 'date-time' },
          example: {
            "1": "2024-03-23T10:00:00.000Z",
            "3": "2024-03-24T14:30:00.000Z"
          }
        },
        overdueUmbrellas: {
          type: 'array',
          items: { type: 'number' },
          example: [1]
        },
        updatedAt: { 
          type: 'string', 
          format: 'date-time',
          example: "2024-03-21T14:30:00.000Z"
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
  })
  async getUserBorrowHistory(@Param('email') email: string) {
    return this.mypageService.getUserBorrowHistory(email);
  }
}
