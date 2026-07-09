import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase, PurchaseItem } from './entities/purchase.entity';
import { PurchasesService } from './services/purchases.service';
import { PurchasesController } from './controllers/purchases.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, PurchaseItem])],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
