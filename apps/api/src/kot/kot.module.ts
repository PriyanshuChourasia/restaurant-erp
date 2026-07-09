import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kot, KotItem } from './entities/kot.entity';
import { KotService } from './services/kot.service';
import { KotController } from './controllers/kot.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Kot, KotItem])],
  controllers: [KotController],
  providers: [KotService],
  exports: [KotService],
})
export class KotModule {}
