import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { Item, ItemUnit } from '../../items/entities/item.entity';
import { decimalTransformer } from '../../shared/transformers/decimal.transformer';

@Entity('recipes')
@Index('idx_recipe_output_item', ['outputItemId'], { unique: true })
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'output_item_id', type: 'uuid', unique: true })
  outputItemId!: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'output_item_id' })
  outputItem!: Item;

  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'yield_quantity', transformer: decimalTransformer })
  yieldQuantity!: number;

  @Column({ type: 'enum', enum: ItemUnit, name: 'yield_unit' })
  yieldUnit!: ItemUnit;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @OneToMany(() => RecipeIngredient, (ing) => ing.recipe, { cascade: true })
  ingredients!: RecipeIngredient[];
}

@Entity('recipe_ingredients')
@Index('idx_recipe_ingredient_recipe', ['recipeId'])
@Index('idx_recipe_ingredient_unique', ['recipeId', 'componentItemId'], { unique: true })
export class RecipeIngredient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'recipe_id', type: 'uuid' })
  recipeId!: string;

  @ManyToOne(() => Recipe, (r) => r.ingredients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe!: Recipe;

  @Column({ name: 'component_item_id', type: 'uuid' })
  componentItemId!: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'component_item_id' })
  componentItem!: Item;

  @Column({ type: 'decimal', precision: 10, scale: 3, transformer: decimalTransformer })
  quantity!: number;

  @Column({ type: 'enum', enum: ItemUnit })
  unit!: ItemUnit;
}
