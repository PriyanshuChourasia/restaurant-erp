import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Play, Loader2, CheckCircle } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getItems } from '@/modules/items/api/items.api'
import { useCreateProductionEntry } from '../hooks/useRecipeQueries'

export function KitchenPrepPage() {
  const queryClient = useQueryClient()
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['items-list-for-prep'],
    queryFn: () => getItems({ limit: 500 }),
  })

  const createMutation = useCreateProductionEntry()

  const [selectedItemId, setSelectedItemId] = useState('')
  const [batchQuantity, setBatchQuantity] = useState(1)
  const [success, setSuccess] = useState(false)

  const items = itemsData?.items || []
  // Only show semi_finished and finished items that have recipes
  const eligibleItems = items.filter((item) =>
    item.productType === 'semi_finished' || item.productType === 'finished',
  )

  const handleSubmit = () => {
    if (!selectedItemId || batchQuantity <= 0) return

    setSuccess(false)
    createMutation.mutate(
      { itemId: selectedItemId, batchQuantity },
      {
        onSuccess: () => {
          setSuccess(true)
          setSelectedItemId('')
          setBatchQuantity(1)
          queryClient.invalidateQueries({ queryKey: ['items'] })
          queryClient.invalidateQueries({ queryKey: ['inventory'] })
          setTimeout(() => setSuccess(false), 3000)
        },
      },
    )
  }

  if (itemsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/inventory" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Play size={22} className="text-primary" /> Kitchen Prep
          </h1>
          <p className="text-sm text-gray-500">Log a production batch — deducts raw materials and adds finished stock</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-2 text-green-700">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">Production entry recorded successfully!</span>
        </div>
      )}

      {createMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm">
          {(createMutation.error as any)?.response?.data?.message || 'Production failed. Check stock levels.'}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item to Produce *</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={selectedItemId}
            onChange={(e) => { setSelectedItemId(e.target.value); setSuccess(false) }}
            required
          >
            <option value="">Select item...</option>
            {eligibleItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.productType === 'semi_finished' ? 'Semi-Finished' : 'Finished'})
              </option>
            ))}
          </select>
          {eligibleItems.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              No semi-finished or finished items found. Create items with "Semi-Finished" or "Finished" product type first.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Batch Quantity *</label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={batchQuantity}
            onChange={(e) => setBatchQuantity(Number(e.target.value))}
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending || !selectedItemId}
            className="btn btn-primary flex items-center gap-2"
          >
            <Play size={16} />
            {createMutation.isPending ? 'Processing...' : 'Run Production'}
          </button>
          <Link to="/inventory" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
