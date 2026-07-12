import { useState } from 'react'
import { Save, Trash2, Plus, Calculator, Loader2, FlaskConical } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getItems } from '@/modules/items/api/items.api'
import { useRecipe, useRecipeCost, useUpsertRecipe, useDeleteRecipe, usePersistRecipeCost } from '../hooks/useRecipeQueries'
import type { RecipeIngredient } from '../types/recipe.types'

const UNITS = ['piece', 'kg', 'gram', 'litre', 'ml', 'dozen', 'plate', 'bowl', 'cup', 'glass', 'bottle', 'box', 'packet']

interface RecipeEditorProps {
  itemId: string
}

export function RecipeEditor({ itemId }: RecipeEditorProps) {
  const { data: recipe, isLoading: recipeLoading } = useRecipe(itemId)
  const { data: costResult } = useRecipeCost(itemId)
  const { data: allItems } = useQuery({
    queryKey: ['items-list'],
    queryFn: () => getItems({ limit: 500 }),
  })

  const upsertMutation = useUpsertRecipe()
  const deleteMutation = useDeleteRecipe()
  const persistCostMutation = usePersistRecipeCost()

  const [yieldQuantity, setYieldQuantity] = useState(1)
  const [yieldUnit, setYieldUnit] = useState('plate')
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])
  const [isEditing, setIsEditing] = useState(false)

  // Initialize form from existing recipe
  const [initialized, setInitialized] = useState(false)
  if (recipe && !initialized) {
    setYieldQuantity(recipe.yieldQuantity)
    setYieldUnit(recipe.yieldUnit)
    setIngredients(recipe.ingredients.map((i) => ({ ...i })))
    setInitialized(true)
  }

  const items = (allItems?.items || []).filter((item) => item.id !== itemId)

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: '', recipeId: '', componentItemId: '', quantity: 1, unit: 'piece' },
    ])
  }

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    const updated = [...ingredients]
    ;(updated[index] as any)[field] = value
    setIngredients(updated)
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    upsertMutation.mutate(
      {
        outputItemId: itemId,
        yieldQuantity,
        yieldUnit,
        ingredients: ingredients
          .filter((i) => i.componentItemId)
          .map((i) => ({
            componentItemId: i.componentItemId,
            quantity: i.quantity,
            unit: i.unit,
          })),
      },
      {
        onSuccess: () => setIsEditing(false),
      },
    )
  }

  const handleDelete = () => {
    if (confirm('Delete this recipe?')) {
      deleteMutation.mutate(itemId)
      setIngredients([])
      setYieldQuantity(1)
      setInitialized(false)
    }
  }

  const handlePersistCost = () => {
    persistCostMutation.mutate(itemId)
  }

  if (recipeLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={20} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FlaskConical size={20} className="text-primary" />
          Recipe / Bill of Materials
        </h3>
        <div className="flex gap-2">
          {!isEditing && recipe && (
            <button onClick={() => setIsEditing(true)} className="btn btn-secondary text-sm">
              Edit Recipe
            </button>
          )}
          {recipe && (
            <button onClick={handlePersistCost} disabled={persistCostMutation.isPending} className="btn btn-secondary text-sm flex items-center gap-1">
              <Calculator size={14} />
              {persistCostMutation.isPending ? 'Saving...' : 'Recalculate Cost'}
            </button>
          )}
          {!recipe && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn btn-primary text-sm flex items-center gap-1">
              <Plus size={14} />
              Create Recipe
            </button>
          )}
        </div>
      </div>

      {/* Cost summary */}
      {costResult && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Computed Cost Price:</span>
            <span className="text-sm font-semibold text-gray-900">
              ₹{costResult.totalCost.toFixed(2)} per {yieldUnit || 'unit'}
            </span>
          </div>
          {costResult.breakdown.length > 0 && (
            <div className="mt-2 space-y-1">
              {costResult.breakdown.map((b) => (
                <div key={b.itemId} className="flex items-center justify-between text-xs text-gray-500">
                  <span>{b.itemName} × {b.quantity}</span>
                  <span>₹{(b.quantity * b.unitCost).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(isEditing || !recipe) && (
        <div className="space-y-3">
          {/* Yield info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yield Quantity</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={yieldQuantity}
                onChange={(e) => setYieldQuantity(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yield Unit</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={yieldUnit}
                onChange={(e) => setYieldUnit(e.target.value)}
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Ingredients</label>
              <button onClick={addIngredient} className="text-sm text-primary hover:underline flex items-center gap-1">
                <Plus size={14} /> Add
              </button>
            </div>

            {ingredients.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">No ingredients added yet. Click "Add" to start.</p>
            )}

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <select
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                      value={ing.componentItemId}
                      onChange={(e) => updateIngredient(idx, 'componentItemId', e.target.value)}
                    >
                      <option value="">Select item...</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(idx, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div className="w-24">
                    <select
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                      value={ing.unit}
                      onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    >
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={upsertMutation.isPending} className="btn btn-primary text-sm flex items-center gap-1">
              <Save size={14} />
              {upsertMutation.isPending ? 'Saving...' : 'Save Recipe'}
            </button>
            <button onClick={() => setIsEditing(false)} className="btn btn-secondary text-sm">Cancel</button>
            {recipe && (
              <button onClick={handleDelete} disabled={deleteMutation.isPending} className="btn btn-secondary text-sm text-red-600 hover:text-red-700 ml-auto">
                Delete Recipe
              </button>
            )}
          </div>
        </div>
      )}

      {/* Read-only view when recipe exists and not editing */}
      {recipe && !isEditing && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Yield: <span className="font-medium">{recipe.yieldQuantity} {recipe.yieldUnit}</span>
          </div>
          <div className="space-y-1">
            {recipe.ingredients.map((ing) => (
              <div key={ing.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                <span className="text-gray-700">{ing.componentItem?.name || ing.componentItemId}</span>
                <span className="text-gray-500">{ing.quantity} {ing.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
