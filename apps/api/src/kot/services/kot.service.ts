import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kot, KotItem, KotStatus, KotStation } from '../entities/kot.entity';

@Injectable()
export class KotService {
  constructor(
    @InjectRepository(Kot)
    private readonly repo: Repository<Kot>,
  ) {}

  async findAll(page = 1, limit = 20, status?: string, station?: string) {
    const query = this.repo.createQueryBuilder('kot')
      .leftJoinAndSelect('kot.items', 'items');

    if (status) query.andWhere('kot.status = :status', { status });
    if (station) query.andWhere('kot.station = :station', { station });

    query.orderBy('kot.createdAt', 'DESC');
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const kot = await this.repo.findOne({ where: { id }, relations: { items: true } });
    if (!kot) throw new NotFoundException('KOT not found');
    return kot;
  }

  async findByOrderId(orderId: string) {
    return this.repo.find({ where: { orderId } });
  }

  async create(dto: {
    orderId?: string;
    tableIds?: string[];
    station: KotStation;
    notes?: string;
    preparedBy?: string;
    items: Array<{ itemId: string; itemName: string; quantity: number; instructions?: string }>;
  }) {
    const count = await this.repo.count();
    const kot = this.repo.create({
      kotNumber: `KOT-${String(count + 1).padStart(5, '0')}`,
      orderId: dto.orderId || null,
      tableIds: dto.tableIds && dto.tableIds.length > 0 ? dto.tableIds : null,
      station: dto.station,
      notes: dto.notes || null,
      preparedBy: dto.preparedBy || null,
      status: KotStatus.PENDING,
      items: dto.items.map((i) => ({
        itemId: i.itemId,
        itemName: i.itemName,
        quantity: i.quantity,
        instructions: i.instructions || null,
        status: KotStatus.PENDING,
      })) as KotItem[],
    });
    return this.repo.save(kot);
  }

  async updateStatus(id: string, status: KotStatus, preparedBy?: string) {
    const kot = await this.findById(id);
    const updates: Partial<Kot> = { status };
    if (status === KotStatus.PREPARING) {
      updates.startedAt = new Date();
      if (preparedBy) updates.preparedBy = preparedBy;
    }
    if (status === KotStatus.READY) updates.completedAt = new Date();
    if (status === KotStatus.SERVED) updates.servedAt = new Date();
    await this.repo.update(id, updates);
    return this.findById(id);
  }

  async updateItemStatus(kotId: string, itemId: string, status: KotStatus, preparedBy?: string) {
    const kot = await this.findById(kotId);
    const item = kot.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('KOT item not found');
    item.status = status;
    await this.repo.save(kot);

    // Auto-update KOT status based on items
    const allDone = kot.items.every((i) => [KotStatus.READY, KotStatus.SERVED].includes(i.status as KotStatus));
    const anyStarted = kot.items.some((i) => i.status !== KotStatus.PENDING);
    if (allDone) await this.repo.update(kotId, { status: KotStatus.READY, completedAt: new Date() });
    else if (anyStarted) {
      const updates: Partial<Kot> = { status: KotStatus.PREPARING, startedAt: new Date() };
      if (preparedBy) updates.preparedBy = preparedBy;
      await this.repo.update(kotId, updates);
    }
    return this.findById(kotId);
  }

  async getActiveKots(station?: string) {
    const query = this.repo.createQueryBuilder('kot')
      .leftJoinAndSelect('kot.items', 'items')
      .where('kot.status IN (:...statuses)', { statuses: [KotStatus.PENDING, KotStatus.PREPARING] });
    if (station) query.andWhere('kot.station = :station', { station });
    query.orderBy('kot.createdAt', 'ASC');
    return query.getMany();
  }
}
