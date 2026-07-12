import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice, InvoiceItem } from '../sales/entities/sales.entity';
import { Item } from '../items/entities/item.entity';
import { CategoryEntity } from '../category/entities/category.entity';
import { Inventory, StockMovement } from '../inventory/entities/inventory.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { LedgerAccount, LedgerEntry } from '../ledger/entities/ledger.entity';
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
      Purchase,
      LedgerAccount,
      LedgerEntry,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
