import { formatQuantity, compactQuantity, toLargerUnit } from '@/lib/format-quantity'

export interface FormattedQuantityProps {
  /** Raw quantity value (e.g., 3400) */
  quantity: number
  /** Unit code the quantity is stored in (e.g., 'gram') */
  unit: string
  /** Display mode */
  variant?: 'full' | 'compact' | 'numeric'
  /** Additional CSS classes */
  className?: string
  /** Show unit code suffix always (default true) */
  showUnit?: boolean
}

/**
 * Displays a quantity in human-readable multi-unit format.
 *
 * @example
 * <FormattedQuantity quantity={3400} unit="gram" />
 * // renders: "3 kg 400 g"
 *
 * <FormattedQuantity quantity={3400} unit="gram" variant="compact" />
 * // renders: "3.4 kg"
 *
 * <FormattedQuantity quantity={5} unit="piece" variant="compact" />
 * // renders: "5 pc"
 */
export function FormattedQuantity({
  quantity,
  unit,
  variant = 'full',
  className = '',
  showUnit = true,
}: FormattedQuantityProps) {
  if (!unit) {
    return <span className={className}>{quantity}</span>
  }

  const display = (() => {
    switch (variant) {
      case 'compact':
        return compactQuantity(quantity, unit)
      case 'numeric': {
        const converted = toLargerUnit(quantity, unit)
        if (showUnit) {
          return `${converted.value} ${converted.unit}`
        }
        return String(converted.value)
      }
      case 'full':
      default:
        return formatQuantity(quantity, unit)
    }
  })()

  return <span className={className}>{display}</span>
}

/**
 * Renders quantity and total in a split layout (e.g., "3 kg 400 g / 5 kg").
 */
export function QuantityRange({
  current,
  max,
  unit,
  className = '',
}: {
  current: number
  max: number
  unit: string
  className?: string
}) {
  return (
    <span className={className}>
      <FormattedQuantity quantity={current} unit={unit} variant="full" />
      <span className="text-gray-400 mx-0.5">/</span>
      <FormattedQuantity quantity={max} unit={unit} variant="full" />
      <span className="text-gray-400 ml-0.5">{unit}</span>
    </span>
  )
}
