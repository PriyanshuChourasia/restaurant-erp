import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase, PurchaseItem } from './entities/purchase.entity';
import { PurchasesService } from './services/purchases.service';
import { PurchasesController } from './controllers/purchases.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { UnitsModule } from '../units/units.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Purchase, PurchaseItem]),
    InventoryModule,
    UnitsModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
