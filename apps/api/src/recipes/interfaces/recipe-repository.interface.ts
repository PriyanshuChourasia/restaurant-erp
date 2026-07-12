import { Recipe } from '../entities/recipe.entity';
import { ProductionEntry } from '../entities/production-entry.entity';

export interface IRecipeRepository {
  findByOutputItem(outputItemId: string): Promise<Recipe | null>;
  findById(id: string): Promise<Recipe | null>;
  create(recipe: Partial<Recipe>): Promise<Recipe>;
  save(recipe: Recipe): Promise<Recipe>;
  remove(recipe: Recipe): Promise<void>;
}

export interface IProductionEntryRepository {
  create(entry: Partial<ProductionEntry>): Promise<ProductionEntry>;
  save(entry: ProductionEntry): Promise<ProductionEntry>;
  findByItem(itemId: string, page?: number, limit?: number): Promise<{ data: ProductionEntry[]; total: number; page: number; limit: number }>;
}
