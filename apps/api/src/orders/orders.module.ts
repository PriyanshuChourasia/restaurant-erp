import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderItem } from './entities/order.entity';
import { OrdersService } from './services/orders.service';
import { OrdersController } from './controllers/orders.controller';
import { PriceLevelsModule } from '../price-levels/price-levels.module';
import { CustomersModule } from '../customers/customers.module';
import { SeatingModule } from '../seating/seating.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { KotModule } from '../kot/kot.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    PriceLevelsModule,
    CustomersModule,
    SeatingModule,
    ReservationsModule,
    KotModule,
    SalesModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
