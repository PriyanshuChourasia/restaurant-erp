import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice, InvoiceItem } from './entities/sales.entity';
import { CreditNote, CreditNoteItem } from './entities/credit-note.entity';
import { Order } from '../orders/entities/order.entity';
import { Item } from '../items/entities/item.entity';
import { Inventory, StockMovement } from '../inventory/entities/inventory.entity';
import { SalesService } from './services/sales.service';
import { SalesController } from './controllers/sales.controller';
import { PriceLevelsModule } from '../price-levels/price-levels.module';
import { CustomersModule } from '../customers/customers.module';
import { SeatingModule } from '../seating/seating.module';
import { RecipesModule } from '../recipes/recipes.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { LedgerModule } from '../ledger/ledger.module';
import { InventoryModule } from '../inventory/inventory.module';
import { KotModule } from '../kot/kot.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceItem, CreditNote, CreditNoteItem, Order, Item, Inventory, StockMovement]),
    PriceLevelsModule,
    CustomersModule,
    SeatingModule,
    RecipesModule,
    VouchersModule,
    LedgerModule,
    InventoryModule,
    KotModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
