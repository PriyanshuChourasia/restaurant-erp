/**
 * Multi-Unit Quantity Formatter (Backend)
 *
 * Mirrors the frontend `lib/format-quantity.ts` so report endpoints can return
 * formatted strings alongside raw numeric values.
 *
 * Unit hierarchies (smaller → larger):
 *   - WEIGHT: gram → kg      (factor 1000)
 *   - VOLUME: ml   → L       (factor 1000)
 *   - COUNT:  piece → dozen  (factor 12)
 *   - COUNT:  packet → carton (factor 50)
 *   - COUNT:  bottle → case   (factor 12)
 */

interface UnitHierarchyEntry {
  largerUnit: string
  factor: number
  largerLabel: string
  smallerLabel: string
}

const UNIT_HIERARCHY: Record<string, UnitHierarchyEntry> = {
  gram:    { largerUnit: 'kg',     factor: 1000, largerLabel: 'kg',     smallerLabel: 'g' },
  ml:      { largerUnit: 'L',      factor: 1000, largerLabel: 'L',      smallerLabel: 'ml' },
  piece:   { largerUnit: 'dozen',  factor: 12,   largerLabel: 'dozen',  smallerLabel: 'pc' },
  packet:  { largerUnit: 'carton', factor: 50,   largerLabel: 'carton', smallerLabel: 'packet' },
  bottle:  { largerUnit: 'case',   factor: 12,   largerLabel: 'case',   smallerLabel: 'bottle' },
}

function getSmallLabel(unit: string): string {
  const labels: Record<string, string> = {
    gram: 'g', ml: 'ml', piece: 'pc',
    packet: 'packet', bottle: 'bottle',
  }
  return labels[unit] || unit
}

/**
 * Format a raw quantity into a human-readable multi-unit string.
 * E.g. formatQuantity(3400, 'gram') → "3 kg 400 g"
 */
export function formatQuantity(qty: number, unit: string): string {
  if (qty === 0) return `0 ${getSmallLabel(unit)}`

  const hierarchy = UNIT_HIERARCHY[unit]
  if (!hierarchy) return `${qty} ${unit}`

  const { factor, largerLabel, smallerLabel } = hierarchy
  const large = Math.floor(Math.abs(qty) / factor)
  const small = Math.abs(qty) % factor

  const parts: string[] = []
  if (large > 0) parts.push(`${large} ${largerLabel}`)
  if (small > 0 || parts.length === 0) parts.push(`${small} ${smallerLabel}`)

  return qty < 0 ? `-${parts.join(' ')}` : parts.join(' ')
}

/**
 * Get a compact label (good for table cells).
 * E.g. compactQuantity(3400, 'gram') → "3.4 kg"
 */
export function compactQuantity(qty: number, unit: string): string {
  const hierarchy = UNIT_HIERARCHY[unit]
  if (!hierarchy) return `${qty} ${unit}`

  const { factor, largerLabel, smallerLabel } = hierarchy
  if (qty >= factor) {
    return `${(qty / factor).toFixed(qty % factor === 0 ? 0 : 1)} ${largerLabel}`
  }
  return `${qty} ${smallerLabel}`
}

/**
 * Get the larger-unit equivalent of a quantity.
 * E.g. toLargerUnit(3400, 'gram') → { value: 3.4, unit: 'kg' }
 */
export function toLargerUnit(
  qty: number,
  unit: string,
): { value: number; unit: string } {
  const hierarchy = UNIT_HIERARCHY[unit]
  if (!hierarchy) return { value: qty, unit }
  return { value: qty / hierarchy.factor, unit: hierarchy.largerLabel }
}
