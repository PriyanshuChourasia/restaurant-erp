import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemSupplier } from './entities/item-supplier.entity';
import { ItemSuppliersService } from './services/item-suppliers.service';
import { ItemSuppliersController } from './controllers/item-suppliers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ItemSupplier])],
  controllers: [ItemSuppliersController],
  providers: [ItemSuppliersService],
  exports: [ItemSuppliersService, TypeOrmModule],
})
export class ItemSuppliersModule {}
