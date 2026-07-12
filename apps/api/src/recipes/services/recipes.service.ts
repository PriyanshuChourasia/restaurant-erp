import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Recipe, RecipeIngredient } from '../entities/recipe.entity';
import { ProductionEntry } from '../entities/production-entry.entity';
import { Item, ProductType } from '../../items/entities/item.entity';
import { Inventory, StockMovement, MovementType } from '../../inventory/entities/inventory.entity';
import { RecipeRepository, ProductionEntryRepository } from '../repositories/recipe.repository';
import { CreateRecipeDto, CreateProductionEntryDto } from '../dto/create-recipe.dto';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

@Injectable()
export class RecipesService {
  constructor(
    private readonly recipeRepo: RecipeRepository,
    private readonly productionEntryRepo: ProductionEntryRepository,
    @InjectRepository(Item) private readonly itemRepo: Repository<Item>,
    @InjectRepository(Inventory) private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(StockMovement) private readonly movementRepo: Repository<StockMovement>,
    private readonly dataSource: DataSource,
  ) {}

  async findByOutputItem(outputItemId: string) {
    const recipe = await this.recipeRepo.findByOutputItem(outputItemId);
    if (!recipe) throw new NotFoundException(`No recipe found for item ${outputItemId}`);
    return recipe;
  }

  async upsert(dto: CreateRecipeDto) {
    // Validate the output item exists
    const outputItem = await this.itemRepo.findOne({ where: { id: dto.outputItemId } });
    if (!outputItem) throw new NotFoundException(`Item ${dto.outputItemId} not found`);

    // Validate all component items exist
    for (const ing of dto.ingredients) {
      const comp = await this.itemRepo.findOne({ where: { id: ing.componentItemId } });
      if (!comp) throw new NotFoundException(`Component item ${ing.componentItemId} not found`);
      if (ing.componentItemId === dto.outputItemId) {
        throw new BadRequestException('A recipe cannot reference itself as an ingredient');
      }
    }

    return this.dataSource.transaction(async (manager) => {
      // Remove existing recipe if any
      const existing = await manager.findOne(Recipe, {
        where: { outputItemId: dto.outputItemId },
        relations: { ingredients: true },
      });
      if (existing) {
        await manager.remove(RecipeIngredient, existing.ingredients);
        await manager.remove(Recipe, existing);
      }

      // Create new recipe
      const recipe = manager.create(Recipe, {
        outputItemId: dto.outputItemId,
        yieldQuantity: dto.yieldQuantity,
        yieldUnit: dto.yieldUnit,
      });
      const savedRecipe = await manager.save(Recipe, recipe);

      // Create ingredients
      const ingredients = dto.ingredients.map((ing) =>
        manager.create(RecipeIngredient, {
          recipeId: savedRecipe.id,
          componentItemId: ing.componentItemId,
          quantity: ing.quantity,
          unit: ing.unit,
        }),
      );
      savedRecipe.ingredients = await manager.save(RecipeIngredient, ingredients);

      // Reload with relations
      return manager.findOne(Recipe, {
        where: { id: savedRecipe.id },
        relations: { ingredients: { componentItem: true }, outputItem: true },
      });
    });
  }

  async removeByOutputItem(outputItemId: string) {
    const recipe = await this.recipeRepo.findByOutputItem(outputItemId);
    if (!recipe) throw new NotFoundException(`No recipe found for item ${outputItemId}`);
    await this.recipeRepo.remove(recipe);
    return { message: 'Recipe deleted' };
  }

  async computeCost(itemId: string, visited = new Set<string>()): Promise<{ totalCost: number; breakdown: Array<{ itemId: string; itemName: string; quantity: number; unitCost: number }> }> {
    const recipe = await this.recipeRepo.findByOutputItem(itemId);

    // No recipe — return the item's own costPrice
    if (!recipe) {
      const item = await this.itemRepo.findOne({ where: { id: itemId } });
      if (!item) throw new NotFoundException(`Item ${itemId} not found`);
      return { totalCost: item.costPrice, breakdown: [] };
    }

    // Circular reference guard
    if (visited.has(itemId)) {
      throw new BadRequestException(`Circular recipe reference detected involving item ${itemId}`);
    }
    visited.add(itemId);

    const breakdown: Array<{ itemId: string; itemName: string; quantity: number; unitCost: number }> = [];
    let totalIngredientCost = 0;

    for (const ing of recipe.ingredients) {
      const childCost = await this.computeCost(ing.componentItemId, new Set(visited));
      const costForQty = ing.quantity * childCost.totalCost;
      totalIngredientCost += costForQty;

      breakdown.push({
        itemId: ing.componentItemId,
        itemName: ing.componentItem?.name || 'Unknown',
        quantity: ing.quantity,
        unitCost: childCost.totalCost,
      });
    }

    const totalCost = recipe.yieldQuantity > 0 ? totalIngredientCost / recipe.yieldQuantity : 0;

    return { totalCost, breakdown };
  }

  async persistCost(itemId: string) {
    const { totalCost } = await this.computeCost(itemId);
    await this.itemRepo.update(itemId, { costPrice: totalCost });
    return { itemId, costPrice: totalCost };
  }

  async deductOnSale(itemId: string, soldQuantity: number, invoiceNumber: string) {
    const recipe = await this.recipeRepo.findByOutputItem(itemId);

    // No recipe — caller should do direct deduction (existing behavior)
    if (!recipe) return false;

    for (const ing of recipe.ingredients) {
      const requiredQty = (soldQuantity / recipe.yieldQuantity) * ing.quantity;

      const inv = await this.inventoryRepo.findOne({ where: { itemId: ing.componentItemId } });
      if (!inv) continue; // Skip if component has no inventory record

      const balanceBefore = inv.currentStock;
      const balanceAfter = balanceBefore - requiredQty;

      inv.currentStock = balanceAfter;
      await this.inventoryRepo.save(inv);

      await this.movementRepo.save(this.movementRepo.create({
        itemId: ing.componentItemId,
        type: MovementType.SALE_OUT,
        quantity: requiredQty,
        balanceBefore,
        balanceAfter,
        reference: invoiceNumber,
        notes: `Recipe deduction: ${soldQuantity}x ${recipe.outputItem?.name || itemId}`,
      }));
    }

    return true;
  }

  async createProductionEntry(dto: CreateProductionEntryDto, userId?: string) {
    const outputItem = await this.itemRepo.findOne({ where: { id: dto.itemId } });
    if (!outputItem) throw new NotFoundException(`Item ${dto.itemId} not found`);

    const recipe = await this.recipeRepo.findByOutputItem(dto.itemId);
    if (!recipe) throw new BadRequestException(`Item ${dto.itemId} has no recipe. Create a recipe first.`);

    return this.dataSource.transaction(async (manager) => {
      // 1. Deduct raw/component stock
      for (const ing of recipe.ingredients) {
        const requiredQty = (dto.batchQuantity / recipe.yieldQuantity) * ing.quantity;

        const inv = await manager.findOne(Inventory, { where: { itemId: ing.componentItemId } });
        if (!inv) throw new BadRequestException(`No inventory record for component item ${ing.componentItemId}`);

        const balanceBefore = inv.currentStock;
        const balanceAfter = balanceBefore - requiredQty;
        if (balanceAfter < 0) {
          throw new BadRequestException(`Insufficient stock for ${ing.componentItem?.name || ing.componentItemId}: need ${requiredQty}, have ${balanceBefore}`);
        }

        inv.currentStock = balanceAfter;
        await manager.save(Inventory, inv);

        await manager.save(StockMovement, manager.create(StockMovement, {
          itemId: ing.componentItemId,
          type: MovementType.PRODUCTION_CONSUMPTION,
          quantity: requiredQty,
          balanceBefore,
          balanceAfter,
          reference: `PROD-${dto.itemId.slice(0, 8)}`,
          notes: `Production: ${dto.batchQuantity} ${recipe.yieldUnit} of ${outputItem.name}`,
          createdBy: userId || null,
        }));
      }

      // 2. Add produced item stock
      let outputInv = await manager.findOne(Inventory, { where: { itemId: dto.itemId } });
      if (!outputInv) {
        outputInv = manager.create(Inventory, {
          itemId: dto.itemId,
          openingBalance: 0,
          currentStock: 0,
          minStockLevel: 0,
          unitCost: 0,
        });
      }

      const balanceBefore = outputInv.currentStock;
      outputInv.currentStock = balanceBefore + dto.batchQuantity;
      await manager.save(Inventory, outputInv);

      await manager.save(StockMovement, manager.create(StockMovement, {
        itemId: dto.itemId,
        type: MovementType.PRODUCTION_YIELD,
        quantity: dto.batchQuantity,
        balanceBefore,
        balanceAfter: outputInv.currentStock,
        reference: `PROD-${dto.itemId.slice(0, 8)}`,
        notes: `Production yield: ${dto.batchQuantity} ${recipe.yieldUnit} of ${outputItem.name}`,
        createdBy: userId || null,
      }));

      // 3. Log the production entry
      const entry = manager.create(ProductionEntry, {
        itemId: dto.itemId,
        batchQuantity: dto.batchQuantity,
        producedAt: new Date(),
        createdBy: userId || null,
      });
      return manager.save(ProductionEntry, entry);
    });
  }
}
