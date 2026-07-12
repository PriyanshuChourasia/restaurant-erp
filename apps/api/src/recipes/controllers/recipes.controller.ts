import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { RecipesService } from '../services/recipes.service';
import { CreateRecipeDto, CreateProductionEntryDto } from '../dto/create-recipe.dto';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get(':itemId')
  findByOutputItem(@Param('itemId') itemId: string) {
    return this.recipesService.findByOutputItem(itemId);
  }

  @Post()
  upsert(@Body() dto: CreateRecipeDto) {
    return this.recipesService.upsert(dto);
  }

  @Delete(':itemId')
  removeByOutputItem(@Param('itemId') itemId: string) {
    return this.recipesService.removeByOutputItem(itemId);
  }

  @Get(':itemId/cost')
  computeCost(@Param('itemId') itemId: string) {
    return this.recipesService.computeCost(itemId);
  }

  @Post(':itemId/recalculate-cost')
  persistCost(@Param('itemId') itemId: string) {
    return this.recipesService.persistCost(itemId);
  }

  @Post('production')
  createProductionEntry(@Body() dto: CreateProductionEntryDto) {
    return this.recipesService.createProductionEntry(dto);
  }
}
