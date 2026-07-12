import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReservationRepository } from '../repositories/reservation.repository';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationDto } from '../dto/update-reservation.dto';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { TablesService } from '../../seating/services/tables.service';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly reservationRepo: ReservationRepository,
    private readonly tablesService: TablesService,
  ) {}

  async findAll(dateFrom?: string, dateTo?: string, status?: string) {
    return this.reservationRepo.findAll({ dateFrom, dateTo, status });
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepo.findById(id);
    if (!reservation) throw new NotFoundException(`Reservation with ID "${id}" not found`);
    return this.applyLazyExpiry(reservation);
  }

  async create(dto: CreateReservationDto): Promise<Reservation> {
    // Validate table if provided
    if (dto.tableId) {
      await this.tablesService.findOne(dto.tableId);
    }

    return this.reservationRepo.create({
      customerName: dto.customerName,
      customerPhone: dto.customerPhone ?? null,
      partySize: dto.partySize,
      zoneId: dto.zoneId ?? null,
      tableId: dto.tableId ?? null,
      scheduledFor: new Date(dto.scheduledFor),
      durationMinutes: dto.durationMinutes ?? 90,
      source: (dto.source as any) ?? 'online',
      status: (dto.status as ReservationStatus) ?? ReservationStatus.PENDING,
      notes: dto.notes ?? null,
    });
  }

  async update(id: string, dto: UpdateReservationDto): Promise<Reservation> {
    await this.findOne(id);

    // Validate table if changing it
    if (dto.tableId) {
      await this.tablesService.findOne(dto.tableId);
    }

    return this.reservationRepo.update(id, {
      ...(dto.customerName !== undefined && { customerName: dto.customerName }),
      ...(dto.customerPhone !== undefined && { customerPhone: dto.customerPhone ?? null }),
      ...(dto.partySize !== undefined && { partySize: dto.partySize }),
      ...(dto.zoneId !== undefined && { zoneId: dto.zoneId ?? null }),
      ...(dto.tableId !== undefined && { tableId: dto.tableId ?? null }),
      ...(dto.scheduledFor !== undefined && { scheduledFor: new Date(dto.scheduledFor) }),
      ...(dto.durationMinutes !== undefined && { durationMinutes: dto.durationMinutes }),
      ...(dto.source !== undefined && { source: dto.source as any }),
      ...(dto.status !== undefined && { status: dto.status as ReservationStatus }),
      ...(dto.notes !== undefined && { notes: dto.notes ?? null }),
    });
  }

  async updateStatus(id: string, status: string): Promise<Reservation> {
    await this.findOne(id);
    await this.reservationRepo.updateStatus(id, status);

    // If seating, occupy the table
    if (status === ReservationStatus.SEATED) {
      const reservation = await this.reservationRepo.findById(id);
      if (reservation?.tableId) {
        await this.tablesService.updateStatus(reservation.tableId, 'occupied');
      }
    }

    // If cancelling or marking no-show, release the table if it was occupied
    if ([ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW].includes(status as ReservationStatus)) {
      const reservation = await this.reservationRepo.findById(id);
      if (reservation?.tableId) {
        const table = await this.tablesService.findOne(reservation.tableId);
        if (table.status === 'occupied') {
          await this.tablesService.updateStatus(reservation.tableId, 'available');
        }
      }
    }

    return this.findOne(id);
  }

  async seat(id: string, tableId: string): Promise<Reservation> {
    const reservation = await this.findOne(id);
    if (reservation.status !== ReservationStatus.PENDING &&
        reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException(
        `Cannot seat a reservation with status "${reservation.status}"`,
      );
    }

    // Verify table exists
    await this.tablesService.findOne(tableId);

    // Link table and mark seated
    await this.reservationRepo.update(id, {
      tableId,
      status: ReservationStatus.SEATED,
    });

    // Occupy the table
    await this.tablesService.updateStatus(tableId, 'occupied');

    return this.findOne(id);
  }

  async checkTableConflict(tableId: string, withinMinutes = 120): Promise<Reservation | null> {
    // Verify table exists
    await this.tablesService.findOne(tableId);

    const upcoming = await this.reservationRepo.findUpcomingForTable(tableId, withinMinutes);
    if (!upcoming) return null;

    // Apply lazy expiry — if the reservation is stale, don't report it as a conflict
    const effective = await this.applyLazyExpiry(upcoming);
    if (effective.status === ReservationStatus.NO_SHOW) return null;

    return effective;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.reservationRepo.softDelete(id);
  }

  /**
   * Lazy-expiry: if a confirmed reservation's scheduled time + grace period (15 min)
   * has passed and it was never seated, automatically expire it to no_show.
   */
  private async applyLazyExpiry(reservation: Reservation): Promise<Reservation> {
    if (reservation.status !== ReservationStatus.CONFIRMED) return reservation;

    const graceMs = 15 * 60_000; // 15 minutes grace
    const expiryTime = new Date(reservation.scheduledFor.getTime() + reservation.durationMinutes * 60_000 + graceMs);

    if (new Date() > expiryTime) {
      // Persist the expiry
      await this.reservationRepo.updateStatus(reservation.id, ReservationStatus.NO_SHOW);
      return { ...reservation, status: ReservationStatus.NO_SHOW };
    }

    return reservation;
  }
}
