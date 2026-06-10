import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller()
export class StatusController {
  @Get('status')
  @HttpCode(200)
  status(): string {
    return 'OK';
  }
}

export default StatusController;
