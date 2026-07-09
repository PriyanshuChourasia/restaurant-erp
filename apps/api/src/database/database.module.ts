import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { CategoryEntity } from '../category/entities/category.entity';
import { Item } from '../items/entities/item.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { Inventory, StockMovement } from '../inventory/entities/inventory.entity';
import { LedgerAccount, LedgerEntry } from '../ledger/entities/ledger.entity';
import { Invoice, InvoiceItem } from '../sales/entities/sales.entity';
import { Kot, KotItem } from '../kot/entities/kot.entity';
import { Purchase, PurchaseItem } from '../purchases/entities/purchase.entity';
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
      LedgerAccount,
      LedgerEntry,
      Invoice,
      InvoiceItem,
      Kot,
      KotItem,
      Purchase,
      PurchaseItem,
    ]),
  ],
  providers: [DatabaseSeedService],
})
export class DatabaseModule {}
