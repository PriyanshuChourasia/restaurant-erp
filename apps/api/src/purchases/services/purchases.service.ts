import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Purchase, PurchaseItem, PurchaseStatus } from '../entities/purchase.entity';
import { InventoryService } from '../../inventory/services/inventory.service';
import { Inventory, StockMovement, MovementType } from '../../inventory/entities/inventory.entity';
import { UnitsService } from '../../units/services/units.service';
import { StorageUnitsService } from '../../inventory/services/storage-units.service';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private readonly repo: Repository<Purchase>,
    private readonly inventoryService: InventoryService,
    private readonly unitsService: UnitsService,
    private readonly storageUnitsService: StorageUnitsService,
    @InjectDataSource() private readonly dataSource: DataSource,
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
      relations: { supplier: true, items: { item: { unit: true } } },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async receive(id: string, userId?: string) {
    const purchase = await this.repo.findOne({
      where: { id },
      relations: { items: { item: true }, supplier: true },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.status === PurchaseStatus.RECEIVED) {
      throw new ConflictException('Purchase has already been received');
    }
    if (purchase.status === PurchaseStatus.CANCELLED) {
      throw new BadRequestException('Cannot receive a cancelled purchase');
    }

    const defaultStorageUnit = await this.storageUnitsService.findDefault();
    const storageUnitId = defaultStorageUnit.id;

    return this.dataSource.transaction(async (manager) => {
      // Reload purchase within transaction
      const txPurchase = await manager.findOne(Purchase, {
        where: { id },
        relations: { items: { item: true } },
      });
      if (!txPurchase) throw new NotFoundException('Purchase not found');

      for (const line of txPurchase.items) {
        const item = line.item;
        if (!item) {
          throw new NotFoundException(`Item ${line.itemId} not found`);
        }

        // Convert purchase unit quantity to stock unit quantity
        let receivedQty = line.quantity;
        if (item.purchaseUnitId && item.unitId && item.purchaseUnitId !== item.unitId) {
          receivedQty = await this.unitsService.convert(
            line.quantity,
            item.purchaseUnitId,
            item.unitId,
            item.id,
          );
        }

        // Compute GST amount for this line
        const lineUnitCost = Number(line.unitPrice);
        const lineTotal = receivedQty * lineUnitCost;
        const gstRate = Number(line.gstRate);
        const gstAmount = gstRate > 0 ? Math.round((lineTotal * gstRate / 100) * 100) / 100 : 0;

        // Reuse InventoryService's postPurchaseReceipt with the transaction manager
        await this.inventoryService.postPurchaseReceipt(
          item.id,
          storageUnitId,
          receivedQty,
          lineUnitCost,
          txPurchase.purchaseNumber,
          userId,
          gstAmount,
          manager,
        );
      }

      // Mark purchase as received
      txPurchase.status = PurchaseStatus.RECEIVED;
      await manager.save(txPurchase);

      return txPurchase;
    });
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

  async updateStatus(id: string, status: PurchaseStatus, userId?: string) {
    if (status === PurchaseStatus.RECEIVED) {
      // Redirect through receive() to ensure stock posting + unit conversion
      return this.receive(id, userId);
    }
    await this.findById(id);
    await this.repo.update(id, { status });
    return this.findById(id);
  }
}
