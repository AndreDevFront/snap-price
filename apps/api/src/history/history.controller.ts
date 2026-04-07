import { Controller, Get, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Get()
  findAll(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.historyService.findAll(req.user.userId, +page, +limit);
  }

  @Get('stats')
  stats(@Request() req: any) {
    return this.historyService.stats(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.historyService.findOne(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.historyService.remove(id, req.user.userId);
  }
}
