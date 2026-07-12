import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';

@Injectable()
export class ReservationRepository {
  constructor(
    @InjectRepository(Reservation)
    private readonly repo: Repository<Reservation>,
  ) {}

  async findAll(params?: {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }): Promise<Reservation[]> {
    const where: any = { deletedAt: IsNull() };

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.dateFrom && params?.dateTo) {
      where.scheduledFor = [MoreThanOrEqual(new Date(params.dateFrom)), LessThanOrEqual(new Date(params.dateTo))] as any;
    } else if (params?.dateFrom) {
      where.scheduledFor = MoreThanOrEqual(new Date(params.dateFrom)) as any;
    } else if (params?.dateTo) {
      where.scheduledFor = LessThanOrEqual(new Date(params.dateTo)) as any;
    }

    return this.repo.find({
      where,
      relations: { table: true },
      order: { scheduledFor: 'ASC' },
    });
  }

  async findById(id: string): Promise<Reservation | null> {
    return this.repo.findOne({
      where: { id },
      relations: { table: true },
      withDeleted: true,
    });
  }

  async findByTable(tableId: string): Promise<Reservation[]> {
    return this.repo.find({
      where: { tableId, deletedAt: IsNull() },
      order: { scheduledFor: 'DESC' },
    });
  }

  async findUpcomingForTable(
    tableId: string,
    withinMinutes: number,
  ): Promise<Reservation | null> {
    const now = new Date();
    const deadline = new Date(now.getTime() + withinMinutes * 60_000);

    return this.repo.findOne({
      where: {
        tableId,
        status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
        scheduledFor: MoreThanOrEqual(now) as any,
        deletedAt: IsNull(),
      },
      relations: { table: true },
      order: { scheduledFor: 'ASC' },
    });
  }

  async create(data: Partial<Reservation>): Promise<Reservation> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Reservation>): Promise<Reservation> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({
      where: { id },
      relations: { table: true },
    });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.repo.update(id, { status: status as ReservationStatus });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
