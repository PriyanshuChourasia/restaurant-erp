import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { ReservationRepository } from './repositories/reservation.repository';
import { ReservationsService } from './services/reservations.service';
import { ReservationsController } from './controllers/reservations.controller';
import { SeatingModule } from '../seating/seating.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation]), SeatingModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationRepository],
  exports: [ReservationsService],
})
export class ReservationsModule {}
