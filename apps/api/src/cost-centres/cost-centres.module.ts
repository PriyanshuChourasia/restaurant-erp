import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostCentre } from './entities/cost-centre.entity';
import { CostCentresController } from './controllers/cost-centres.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CostCentre])],
  controllers: [CostCentresController],
  exports: [TypeOrmModule],
})
export class CostCentresModule {}
