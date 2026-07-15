import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ItemSupplier } from '../entities/item-supplier.entity';
import { CreateItemSupplierDto } from '../dto/create-item-supplier.dto';
import { UpdateItemSupplierDto } from '../dto/update-item-supplier.dto';

@Injectable()
export class ItemSuppliersService {
  constructor(
    @InjectRepository(ItemSupplier)
    private readonly repo: Repository<ItemSupplier>,
  ) {}

  async findByItem(itemId: string): Promise<ItemSupplier[]> {
    return this.repo.find({
      where: { itemId, deletedAt: IsNull() },
      relations: { supplier: true, unit: true },
      order: { isPreferred: 'DESC', createdAt: 'DESC' },
    });
  }

  async findBySupplier(supplierId: string): Promise<ItemSupplier[]> {
    return this.repo.find({
      where: { supplierId, deletedAt: IsNull() },
      relations: { item: true, unit: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ItemSupplier> {
    const link = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { supplier: true, item: true, unit: true },
    });
    if (!link) throw new NotFoundException(`Item-supplier link not found`);
    return link;
  }

  async create(dto: CreateItemSupplierDto): Promise<ItemSupplier> {
    const existing = await this.repo.findOne({
      where: { itemId: dto.itemId, supplierId: dto.supplierId, deletedAt: IsNull() },
    });
    if (existing) {
      throw new ConflictException('This item-supplier link already exists');
    }

    // If setting as preferred, unset other preferred links for this item
    if (dto.isPreferred) {
      await this.repo.update(
        { itemId: dto.itemId, isPreferred: true, deletedAt: IsNull() },
        { isPreferred: false },
      );
    }

    const link = this.repo.create({
      itemId: dto.itemId,
      supplierId: dto.supplierId,
      supplierSku: dto.supplierSku || null,
      unitPrice: dto.unitPrice,
      unitId: dto.unitId || null,
      leadTimeDays: dto.leadTimeDays ?? 0,
      isPreferred: dto.isPreferred ?? false,
      minOrderQty: dto.minOrderQty ?? 0,
      notes: dto.notes || null,
    });
    return this.repo.save(link);
  }

  async update(id: string, dto: UpdateItemSupplierDto): Promise<ItemSupplier> {
    const link = await this.findOne(id);

    // If setting as preferred, unset other preferred links for this item
    if (dto.isPreferred && !link.isPreferred) {
      await this.repo.update(
        { itemId: link.itemId, isPreferred: true, deletedAt: IsNull() },
        { isPreferred: false },
      );
    }

    await this.repo.update(id, {
      ...dto,
      supplierSku: dto.supplierSku !== undefined ? dto.supplierSku : undefined,
      unitId: dto.unitId !== undefined ? dto.unitId : undefined,
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const link = await this.findOne(id);
    await this.repo.softDelete(id);
  }

  async setPreferred(itemId: string, supplierId: string): Promise<ItemSupplier> {
    const link = await this.repo.findOne({
      where: { itemId, supplierId, deletedAt: IsNull() },
    });
    if (!link) throw new NotFoundException('Item-supplier link not found');

    await this.repo.update(
      { itemId, isPreferred: true, deletedAt: IsNull() },
      { isPreferred: false },
    );
    link.isPreferred = true;
    return this.repo.save(link);
  }
}
