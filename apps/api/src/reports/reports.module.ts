import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice, InvoiceItem } from '../sales/entities/sales.entity';
import { Item } from '../items/entities/item.entity';
import { CategoryEntity } from '../category/entities/category.entity';
import { Inventory, StockMovement } from '../inventory/entities/inventory.entity';
import { StockCount, StockCountLine } from '../inventory/entities/stock-count.entity';
import { Purchase, PurchaseItem } from '../purchases/entities/purchase.entity';
import { LedgerAccount, LedgerEntry } from '../ledger/entities/ledger.entity';
import { Kot, KotItem } from '../kot/entities/kot.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Table as SeatingTable } from '../seating/entities/table.entity';
import { Zone } from '../seating/entities/zone.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organization/entities/organization.entity';
import { ReportsService } from './services/reports.service';
import { ReportsController } from './controllers/reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      InvoiceItem,
      Item,
      CategoryEntity,
      Inventory,
      StockMovement,
      StockCount,
      StockCountLine,
      Purchase,
      PurchaseItem,
      LedgerAccount,
      LedgerEntry,
      Kot,
      KotItem,
      Reservation,
      Customer,
      SeatingTable,
      Zone,
      Supplier,
      User,
      Organization,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
