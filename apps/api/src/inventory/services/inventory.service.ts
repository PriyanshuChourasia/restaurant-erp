import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory, StockMovement, MovementType } from '../entities/inventory.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly repo: Repository<Inventory>,
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
  ) {}

  async findAll(page = 1, limit = 20, search?: string, status?: string) {
    const query = this.repo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.item', 'item')
      .leftJoinAndSelect('item.category', 'category');

    if (search) {
      query.where('item.name ILIKE :search OR item.sku ILIKE :search', { search: `%${search}%` });
    }
    if (status) query.andWhere('inv.status = :status', { status });

    query.orderBy('item.name', 'ASC');
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async findByItem(itemId: string) {
    let inv = await this.repo.findOne({ where: { itemId }, relations: { item: { category: true } } });
    if (!inv) {
      throw new NotFoundException(`Inventory not found for item ${itemId}`);
    }
    return inv;
  }

  async setOpeningBalance(itemId: string, quantity: number, unitCost: number) {
    let inv = await this.repo.findOne({ where: { itemId } });
    if (!inv) {
      inv = this.repo.create({ itemId, openingBalance: quantity, currentStock: quantity, unitCost, minStockLevel: 0 });
    } else {
      inv.openingBalance = quantity;
      inv.currentStock = quantity;
      inv.unitCost = unitCost;
    }
    inv = await this.repo.save(inv);

    await this.movementRepo.save(this.movementRepo.create({
      itemId, type: MovementType.OPENING_BALANCE, quantity,
      balanceBefore: 0, balanceAfter: quantity,
      notes: 'Opening balance', reference: null,
    }));
    return inv;
  }

  async adjustStock(itemId: string, type: MovementType, quantity: number, notes?: string, reference?: string) {
    if (quantity <= 0) throw new BadRequestException('Quantity must be positive');
    let inv = await this.repo.findOne({ where: { itemId } });
    if (!inv) throw new NotFoundException(`Inventory not found for item ${itemId}`);

    const balanceBefore = inv.currentStock;
    const isOut = [MovementType.SALE_OUT, MovementType.ADJUSTMENT_OUT, MovementType.WASTAGE, MovementType.TRANSFER_OUT, MovementType.PRODUCTION_CONSUMPTION].includes(type);
    const balanceAfter = isOut ? balanceBefore - quantity : balanceBefore + quantity;
    if (isOut && balanceAfter < 0) throw new BadRequestException('Insufficient stock');

    inv.currentStock = balanceAfter;
    await this.repo.save(inv);

    await this.movementRepo.save(this.movementRepo.create({
      itemId, type, quantity, balanceBefore, balanceAfter, notes: notes || null, reference: reference || null,
    }));
    return inv;
  }

  async getLowStock() {
    return this.repo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.item', 'item')
      .where('inv.currentStock <= inv.minStockLevel')
      .andWhere('inv.status = :status', { status: 'active' })
      .orderBy('(inv.currentStock / inv.minStockLevel)', 'ASC')
      .getMany();
  }

  async getMovements(itemId: string, page = 1, limit = 20) {
    const [data, total] = await this.movementRepo.findAndCount({
      where: { itemId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }
}
