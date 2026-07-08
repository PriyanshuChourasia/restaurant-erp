import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { slugify } from '../utils/category.utils'

interface SlugInputProps {
  value: string
  onChange: (value: string) => void
  nameValue: string
  error?: string
}

export function SlugInput({ value, onChange, nameValue, error }: SlugInputProps) {
  const [autoGenerate, setAutoGenerate] = useState(true)

  useEffect(() => {
    if (autoGenerate && nameValue && !value) {
      onChange(slugify(nameValue))
    }
  }, [nameValue, autoGenerate, value, onChange])

  const handleManualEdit = () => {
    if (autoGenerate) {
      setAutoGenerate(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor="slug" className="text-sm font-medium text-foreground">
        Slug <span className="text-destructive">*</span>
      </label>
      <div className="relative">
        <Input
          id="slug"
          value={value}
          onChange={(e) => {
            if (autoGenerate) setAutoGenerate(false)
            onChange(e.target.value)
          }}
          onFocus={handleManualEdit}
          placeholder="category-slug"
          className={`pr-8 ${error ? 'border-destructive' : ''}`}
        />
        <button
          type="button"
          onClick={() => {
            setAutoGenerate(true)
            if (nameValue) onChange(slugify(nameValue))
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          title="Auto-generate from name"
        >
          <RefreshCw size={12} />
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!autoGenerate && (
        <p className="text-[10px] text-muted-foreground">
          Manual edit — click refresh to auto-generate
        </p>
      )}
    </div>
  )
}
