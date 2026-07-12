import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ValidationPipe,
} from '@nestjs/common';
import { TablesService } from '../services/tables.service';
import { CreateTableDto } from '../dto/create-table.dto';
import { UpdateTableDto } from '../dto/update-table.dto';
import { UpdateTableStatusDto } from '../dto/update-table-status.dto';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  findAll(
    @Query('zoneId') zoneId?: string,
    @Query('unassigned') unassigned?: string,
  ) {
    return this.tablesService.findAll(zoneId, unassigned === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Post()
  create(@Body(new ValidationPipe({ transform: true })) dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ValidationPipe({ transform: true })) dto: UpdateTableDto) {
    return this.tablesService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateTableStatusDto,
  ) {
    return this.tablesService.updateStatus(id, dto.status);
  }

  @Patch(':id/zone')
  assignToZone(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) body: { zoneId: string | null },
  ) {
    return this.tablesService.assignToZone(id, body.zoneId);
  }

  @Patch(':id/position')
  updatePosition(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) body: { posX: number; posY: number },
  ) {
    return this.tablesService.updatePosition(id, body.posX, body.posY);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
