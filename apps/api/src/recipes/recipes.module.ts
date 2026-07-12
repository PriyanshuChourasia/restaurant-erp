import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe, RecipeIngredient } from './entities/recipe.entity';
import { ProductionEntry } from './entities/production-entry.entity';
import { Item } from '../items/entities/item.entity';
import { Inventory, StockMovement } from '../inventory/entities/inventory.entity';
import { RecipesService } from './services/recipes.service';
import { RecipesController } from './controllers/recipes.controller';
import { RecipeRepository, ProductionEntryRepository } from './repositories/recipe.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipe, RecipeIngredient, ProductionEntry, Item, Inventory, StockMovement]),
  ],
  controllers: [RecipesController],
  providers: [RecipesService, RecipeRepository, ProductionEntryRepository],
  exports: [RecipesService],
})
export class RecipesModule {}
