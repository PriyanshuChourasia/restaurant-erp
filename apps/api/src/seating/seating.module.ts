import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from './entities/zone.entity';
import { Table } from './entities/table.entity';
import { ZoneRepository } from './repositories/zone.repository';
import { TableRepository } from './repositories/table.repository';
import { ZonesService } from './services/zones.service';
import { TablesService } from './services/tables.service';
import { ZonesController } from './controllers/zones.controller';
import { TablesController } from './controllers/tables.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Zone, Table])],
  controllers: [ZonesController, TablesController],
  providers: [ZonesService, TablesService, ZoneRepository, TableRepository],
  exports: [TablesService],
})
export class SeatingModule {}
