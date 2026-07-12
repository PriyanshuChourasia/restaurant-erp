import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe, RecipeIngredient } from '../entities/recipe.entity';
import { ProductionEntry } from '../entities/production-entry.entity';
import { IRecipeRepository, IProductionEntryRepository } from '../interfaces/recipe-repository.interface';

@Injectable()
export class RecipeRepository implements IRecipeRepository {
  constructor(
    @InjectRepository(Recipe) private readonly repo: Repository<Recipe>,
  ) {}

  async findByOutputItem(outputItemId: string): Promise<Recipe | null> {
    return this.repo.findOne({
      where: { outputItemId },
      relations: { ingredients: { componentItem: true }, outputItem: true },
    });
  }

  async findById(id: string): Promise<Recipe | null> {
    return this.repo.findOne({
      where: { id },
      relations: { ingredients: { componentItem: true }, outputItem: true },
    });
  }

  async create(recipe: Partial<Recipe>): Promise<Recipe> {
    const entity = this.repo.create(recipe);
    return this.repo.save(entity);
  }

  async save(recipe: Recipe): Promise<Recipe> {
    return this.repo.save(recipe);
  }

  async remove(recipe: Recipe): Promise<void> {
    await this.repo.remove(recipe);
  }
}

@Injectable()
export class ProductionEntryRepository implements IProductionEntryRepository {
  constructor(
    @InjectRepository(ProductionEntry) private readonly repo: Repository<ProductionEntry>,
  ) {}

  async create(entry: Partial<ProductionEntry>): Promise<ProductionEntry> {
    const entity = this.repo.create(entry);
    return this.repo.save(entity);
  }

  async save(entry: ProductionEntry): Promise<ProductionEntry> {
    return this.repo.save(entry);
  }

  async findByItem(itemId: string, page = 1, limit = 20): Promise<{ data: ProductionEntry[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.repo.findAndCount({
      where: { itemId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }
}
