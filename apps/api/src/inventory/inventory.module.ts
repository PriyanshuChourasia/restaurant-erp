import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from '../items/entities/item.entity';
import { LedgerAccount } from '../ledger/entities/ledger.entity';
import { Inventory, StockMovement } from './entities/inventory.entity';
import { StockBatch } from './entities/stock-batch.entity';
import { StorageUnit } from './entities/storage-unit.entity';
import { OpeningStockEntry } from './entities/opening-stock-entry.entity';
import { StockCount, StockCountLine } from './entities/stock-count.entity';
import { StockItem } from './entities/stock-item.entity';
import { StockCategory } from './entities/stock-category.entity';
import { StockLedger } from './entities/stock-ledger.entity';
import { InventoryService } from './services/inventory.service';
import { StorageUnitsService } from './services/storage-units.service';
import { StockCountService } from './services/stock-count.service';
import { ExpirySweepService } from './services/expiry-sweep.service';
import { InventoryController } from './controllers/inventory.controller';
import { StorageUnitsController } from './controllers/storage-units.controller';
import { StockCountController } from './controllers/stock-count.controller';
import { StorageUnitRepository } from './repositories/storage-unit.repository';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, StockMovement, StorageUnit, OpeningStockEntry, StockBatch, StockCount, StockCountLine, StockItem, StockCategory, StockLedger, Item, LedgerAccount]), LedgerModule],
  controllers: [InventoryController, StorageUnitsController, StockCountController],
  providers: [InventoryService, StorageUnitsService, StockCountService, ExpirySweepService, StorageUnitRepository],
  exports: [InventoryService, StorageUnitsService],
})
export class InventoryModule {}
