import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ValidationPipe,
} from '@nestjs/common';
import { ReservationsService } from '../services/reservations.service';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationDto } from '../dto/update-reservation.dto';
import { UpdateReservationStatusDto } from '../dto/update-reservation-status.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  findAll(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('status') status?: string,
  ) {
    return this.reservationsService.findAll(dateFrom, dateTo, status);
  }

  @Get('table/:tableId/conflict')
  checkTableConflict(
    @Param('tableId') tableId: string,
    @Query('withinMinutes') withinMinutes?: string,
  ) {
    return this.reservationsService.checkTableConflict(
      tableId,
      withinMinutes ? parseInt(withinMinutes, 10) : 120,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Post()
  create(@Body(new ValidationPipe({ transform: true })) dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ValidationPipe({ transform: true })) dto: UpdateReservationDto) {
    return this.reservationsService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(id, dto.status);
  }

  @Post(':id/seat')
  seat(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) body: { tableId: string },
  ) {
    return this.reservationsService.seat(id, body.tableId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}
