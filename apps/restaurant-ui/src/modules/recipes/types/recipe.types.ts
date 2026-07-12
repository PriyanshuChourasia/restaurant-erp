export interface RecipeIngredient {
  id: string
  recipeId: string
  componentItemId: string
  componentItem?: { id: string; name: string }
  quantity: number
  unit: string
}

export interface Recipe {
  id: string
  outputItemId: string
  outputItemName?: string
  yieldQuantity: number
  yieldUnit: string
  ingredients: RecipeIngredient[]
  createdAt: string
  updatedAt: string
}

export interface RecipeCostBreakdown {
  itemId: string
  itemName: string
  quantity: number
  unitCost: number
}

export interface RecipeCostResult {
  totalCost: number
  breakdown: RecipeCostBreakdown[]
}

export interface CreateRecipeRequest {
  outputItemId: string
  yieldQuantity: number
  yieldUnit: string
  ingredients: Array<{
    componentItemId: string
    quantity: number
    unit: string
  }>
}

export interface ProductionEntry {
  id: string
  itemId: string
  itemName?: string
  batchQuantity: number
  producedAt: string
  createdBy: string | null
  createdAt: string
}

export interface CreateProductionEntryRequest {
  itemId: string
  batchQuantity: number
  notes?: string
}
