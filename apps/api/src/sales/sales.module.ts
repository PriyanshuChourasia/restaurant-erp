import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice, InvoiceItem } from './entities/sales.entity';
import { Item } from '../items/entities/item.entity';
import { Inventory, StockMovement } from '../inventory/entities/inventory.entity';
import { SalesService } from './services/sales.service';
import { SalesController } from './controllers/sales.controller';
import { PriceLevelsModule } from '../price-levels/price-levels.module';
import { CustomersModule } from '../customers/customers.module';
import { SeatingModule } from '../seating/seating.module';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceItem, Item, Inventory, StockMovement]),
    PriceLevelsModule,
    CustomersModule,
    SeatingModule,
    RecipesModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
