import { useState } from 'react'
import { Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActivateToggleProps {
  isActive: boolean
  onActivate: () => Promise<void>
  onDeactivate: () => Promise<void>
}

export function ActivateToggle({
  isActive,
  onActivate,
  onDeactivate,
}: ActivateToggleProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      if (isActive) {
        await onDeactivate()
      } else {
        await onActivate()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={handleToggle}
      disabled={isLoading}
      title={isActive ? 'Deactivate' : 'Activate'}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isActive ? (
        <ToggleRight size={14} className="text-success" />
      ) : (
        <ToggleLeft size={14} className="text-muted-foreground" />
      )}
    </Button>
  )
}
