import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockItem } from './entities/stock-item.entity';
import { StockItemRepository } from './repositories/stock-item.repository';
import { StockItemsService } from './services/stock-items.service';
import { StockItemsController } from './controllers/stock-items.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StockItem])],
  controllers: [StockItemsController],
  providers: [StockItemsService, StockItemRepository],
  exports: [StockItemsService, StockItemRepository],
})
export class StockItemsModule {}
