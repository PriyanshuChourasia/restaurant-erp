import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfMeasure } from './entities/unit-of-measure.entity';
import { UnitConversion } from './entities/unit-conversion.entity';
import { UnitRepository } from './repositories/unit.repository';
import { UnitConversionRepository } from './repositories/unit-conversion.repository';
import { UnitsService } from './services/units.service';
import { UnitsController } from './controllers/units.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UnitOfMeasure, UnitConversion])],
  controllers: [UnitsController],
  providers: [UnitsService, UnitRepository, UnitConversionRepository],
  exports: [UnitsService, UnitRepository],
})
export class UnitsModule {}
