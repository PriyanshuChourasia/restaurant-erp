import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { CategoryEntity } from '../category/entities/category.entity';
import { Item } from '../items/entities/item.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { Inventory, StockMovement } from '../inventory/entities/inventory.entity';
import { OpeningStockEntry } from '../inventory/entities/opening-stock-entry.entity';
import { LedgerAccount, LedgerEntry } from '../ledger/entities/ledger.entity';
import { Invoice, InvoiceItem } from '../sales/entities/sales.entity';
import { Kot, KotItem } from '../kot/entities/kot.entity';
import { Purchase, PurchaseItem } from '../purchases/entities/purchase.entity';
import { Zone } from '../seating/entities/zone.entity';
import { Table } from '../seating/entities/table.entity';
import { Unit } from '../units/entities/unit.entity';
import { UnitOfMeasure } from '../units/entities/unit-of-measure.entity';
import { UnitConversion } from '../units/entities/unit-conversion.entity';
import { StorageUnit } from '../inventory/entities/storage-unit.entity';
import { StockBatch } from '../inventory/entities/stock-batch.entity';
import { StockCount, StockCountLine } from '../inventory/entities/stock-count.entity';
import { StockItem } from '../inventory/entities/stock-item.entity';
import { StockCategory } from '../inventory/entities/stock-category.entity';
import { Customer } from '../customers/entities/customer.entity';
import { PriceLevel } from '../price-levels/entities/price-level.entity';
import { ItemPriceLevel } from '../price-levels/entities/item-price-level.entity';
import { Recipe, RecipeIngredient } from '../recipes/entities/recipe.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ItemSupplier } from '../item-suppliers/entities/item-supplier.entity';
import { VoucherType } from '../vouchers/entities/voucher-type.entity';
import { VoucherModuleEntity } from '../vouchers/entities/voucher-module.entity';
import { DatabaseSeedService } from './database-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      Role,
      User,
      CategoryEntity,
      Item,
      Supplier,
      Inventory,
      StockMovement,
      OpeningStockEntry,
      LedgerAccount,
      LedgerEntry,
      Invoice,
      InvoiceItem,
      Kot,
      KotItem,
      Purchase,
      PurchaseItem,
      Zone,
      Table,
      Unit,
      UnitOfMeasure,
      UnitConversion,
      StorageUnit,
      StockBatch,
      StockCount,
      StockCountLine,
      StockItem,
      StockCategory,
      Customer,
      PriceLevel,
      ItemPriceLevel,
      Recipe,
      RecipeIngredient,
      Reservation,
      ItemSupplier,
      VoucherType,
      VoucherModuleEntity,
    ]),
  ],
  providers: [DatabaseSeedService],
})
export class DatabaseModule {}
