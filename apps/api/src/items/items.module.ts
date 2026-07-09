import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { ItemRepository } from './repositories/item.repository';
import { ItemsService } from './services/items.service';
import { ItemsController } from './controllers/items.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Item])],
  controllers: [ItemsController],
  providers: [ItemsService, ItemRepository],
  exports: [ItemsService, ItemRepository],
})
export class ItemsModule {}
