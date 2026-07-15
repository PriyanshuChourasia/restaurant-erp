import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unit } from './entities/unit.entity';
import { UnitConversion } from './entities/unit-conversion.entity';
import { UnitRepository } from './repositories/unit.repository';
import { UnitConversionRepository } from './repositories/unit-conversion.repository';
import { UnitsService } from './services/units.service';
import { UnitsController } from './controllers/units.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Unit, UnitConversion])],
  controllers: [UnitsController],
  providers: [UnitsService, UnitRepository, UnitConversionRepository],
  exports: [UnitsService, UnitRepository],
})
export class UnitsModule {}
