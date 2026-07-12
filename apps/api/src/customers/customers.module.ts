import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerRepository } from './repositories/customer.repository';
import { CustomersService } from './services/customers.service';
import { CustomersController } from './controllers/customers.controller';
import { PriceLevelRepository } from '../price-levels/repositories/price-level.repository';
import { PriceLevel } from '../price-levels/entities/price-level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, PriceLevel])],
  controllers: [CustomersController],
  providers: [CustomersService, CustomerRepository, PriceLevelRepository],
  exports: [CustomersService],
})
export class CustomersModule {}
