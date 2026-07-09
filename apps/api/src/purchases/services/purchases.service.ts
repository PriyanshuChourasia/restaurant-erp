import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase, PurchaseItem, PurchaseStatus } from '../entities/purchase.entity';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private readonly repo: Repository<Purchase>,
  ) {}

  async findAll(page = 1, limit = 20, status?: string, search?: string) {
    const query = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.supplier', 'supplier')
      .leftJoinAndSelect('p.items', 'items')
      .where('p.deletedAt IS NULL');

    if (status) query.andWhere('p.status = :status', { status });
    if (search) {
      query.andWhere(
        '(p.purchaseNumber ILIKE :search OR supplier.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy('p.createdAt', 'DESC');
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const purchase = await this.repo.findOne({
      where: { id },
      relations: { supplier: true, items: true },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async create(dto: {
    supplierId: string;
    purchaseDate: string;
    items: Array<{ itemId: string; quantity: number; unitPrice: number; gstRate: number }>;
    notes?: string;
  }) {
    const itemEntities = dto.items.map((i) => {
      const totalPrice = i.quantity * i.unitPrice;
      return { ...i, totalPrice };
    });
    const subtotal = itemEntities.reduce((s, i) => s + i.totalPrice, 0);
    const taxAmount = itemEntities.reduce((s, i) => s + (i.totalPrice * i.gstRate) / 100, 0);
    const totalAmount = subtotal + taxAmount;
    const count = await this.repo.count();
    const purchase = this.repo.create({
      purchaseNumber: `PO-${String(count + 1).padStart(6, '0')}`,
      supplierId: dto.supplierId,
      purchaseDate: new Date(dto.purchaseDate),
      subtotal,
      taxAmount,
      totalAmount,
      notes: dto.notes || null,
      status: PurchaseStatus.ORDERED,
      items: itemEntities as PurchaseItem[],
    });
    return this.repo.save(purchase);
  }

  async updateStatus(id: string, status: PurchaseStatus) {
    await this.findById(id);
    await this.repo.update(id, { status });
    return this.findById(id);
  }
}
