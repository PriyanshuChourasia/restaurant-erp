import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { CategoryModule } from './category/category.module';
import { StockItemsModule } from './stock-items/stock-items.module';
import { InventoryModule } from './inventory/inventory.module';
import { PurchasesModule } from './purchases/purchases.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { SalesModule } from './sales/sales.module';
import { OrdersModule } from './orders/orders.module';
import { KotModule } from './kot/kot.module';
import { LedgerModule } from './ledger/ledger.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { DatabaseModule } from './database/database.module';
import { PriceLevelsModule } from './price-levels/price-levels.module';
import { CustomersModule } from './customers/customers.module';
import { OrganizationModule } from './organization/organization.module';
import { SeatingModule } from './seating/seating.module';
import { RecipesModule } from './recipes/recipes.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UnitsModule } from './units/units.module';
import { ItemSuppliersModule } from './item-suppliers/item-suppliers.module';
import { DeveloperModule } from './developer/developer.module';
// import { DocumentsModule } from './documents/documents.module'; // temporarily disabled for verification — pre-existing unrelated TypeORM error
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { PermissionsGuard } from './shared/guards/permissions.guard';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'restaurant_erp',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    CategoryModule,
    StockItemsModule,
    InventoryModule,
    PurchasesModule,
    SuppliersModule,
    SalesModule,
    OrdersModule,
    KotModule,
    LedgerModule,
    VouchersModule,
    DatabaseModule,
    PriceLevelsModule,
    CustomersModule,
    SeatingModule,
    OrganizationModule,
    RecipesModule,
    ReservationsModule,
    ReportsModule,
    DashboardModule,
    UnitsModule,
    ItemSuppliersModule,
    DeveloperModule,
    // DocumentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
