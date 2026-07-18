import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceLevel } from './entities/price-level.entity';
import { ItemPriceLevel } from './entities/item-price-level.entity';
import { StockItem } from '../stock-items/entities/stock-item.entity';
import { PriceLevelRepository } from './repositories/price-level.repository';
import { ItemPriceLevelRepository } from './repositories/item-price-level.repository';
import { PriceLevelsService } from './services/price-levels.service';
import { PriceLevelsController } from './controllers/price-levels.controller';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TypeOrmModule.forFeature([PriceLevel, ItemPriceLevel, StockItem]), CustomersModule],
  controllers: [PriceLevelsController],
  providers: [PriceLevelsService, PriceLevelRepository, ItemPriceLevelRepository],
  exports: [PriceLevelsService],
})
export class PriceLevelsModule {}
