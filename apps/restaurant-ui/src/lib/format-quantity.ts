/**
 * Multi-Unit Quantity Formatter
 *
 * Converts raw base-unit quantities (e.g., 3400 grams) into human-readable
 * multi-unit format (e.g., "3 kg 400 g").
 *
 * Unit hierarchies (smaller → larger):
 *   - WEIGHT: gram → kg      (factor 1000)
 *   - VOLUME: ml   → L       (factor 1000)
 *   - COUNT:  piece → dozen  (factor 12)
 *   - COUNT:  packet → carton (factor 50)
 *   - COUNT:  bottle → case   (factor 12)
 *
 * Units not in a hierarchy (e.g., bowl, plate, cup, glass, box)
 * are displayed as plain "{qty} {code}".
 */

// ── Unit hierarchy definitions ────────────────────────────────
// Maps a "small" unit code to its "large" unit code + conversion factor.
// The quantity stored in the DB is assumed to be in the "small" unit.

const UNIT_HIERARCHY: Record<
  string,
  { largerUnit: string; factor: number; largerLabel?: string; smallerLabel?: string }
> = {
  gram: {
    largerUnit: 'kg',
    factor: 1000,
    largerLabel: 'kg',
    smallerLabel: 'g',
  },
  ml: {
    largerUnit: 'L',
    factor: 1000,
    largerLabel: 'L',
    smallerLabel: 'ml',
  },
  piece: {
    largerUnit: 'dozen',
    factor: 12,
    largerLabel: 'dozen',
    smallerLabel: 'pc',
  },
  packet: {
    largerUnit: 'carton',
    factor: 50,
    largerLabel: 'carton',
    smallerLabel: 'packet',
  },
  bottle: {
    largerUnit: 'case',
    factor: 12,
    largerLabel: 'case',
    smallerLabel: 'bottle',
  },
}

// ── Formatting function ───────────────────────────────────────

/**
 * Format a raw quantity into a human-readable multi-unit string.
 *
 * @param qty  - The raw quantity (e.g., 3400 for 3400 grams)
 * @param unit - The unit code the quantity is stored in (e.g., "gram")
 * @returns    A formatted string like "3 kg 400 g" or "50 kg" or "24 pc"
 *
 * @example
 * formatQuantity(3400, 'gram')    // → "3 kg 400 g"
 * formatQuantity(1000, 'gram')    // → "1 kg"
 * formatQuantity(500, 'gram')     // → "500 g"
 * formatQuantity(0, 'gram')       // → "0 g"
 * formatQuantity(1500, 'ml')      // → "1 L 500 ml"
 * formatQuantity(2000, 'ml')      // → "2 L"
 * formatQuantity(26, 'piece')     // → "2 dozen 2 pc"
 * formatQuantity(5, 'piece')      // → "5 pc"
 * formatQuantity(12, 'piece')     // → "1 dozen"
 * formatQuantity(10, 'bowl')      // → "10 bowl"
 * formatQuantity(8, 'plate')      // → "8 plate"
 */
export function formatQuantity(qty: number, unit: string): string {
  if (qty === 0) return `0 ${getSmallLabel(unit)}`

  const hierarchy = UNIT_HIERARCHY[unit]

  // No hierarchy defined — just show raw number with unit code
  if (!hierarchy) {
    return `${qty} ${unit}`
  }

  const { largerUnit, factor, largerLabel, smallerLabel } = hierarchy
  const large = Math.floor(Math.abs(qty) / factor)
  const small = Math.abs(qty) % factor

  const parts: string[] = []

  if (large > 0) {
    parts.push(`${large} ${largerLabel || largerUnit}`)
  }
  if (small > 0 || parts.length === 0) {
    parts.push(`${small} ${smallerLabel || unit}`)
  }

  if (qty < 0) {
    return `-${parts.join(' ')}`
  }

  return parts.join(' ')
}

/**
 * Get the display label for a unit when it appears alone (no multi-unit split).
 */
function getSmallLabel(unit: string): string {
  const labels: Record<string, string> = {
    gram: 'g',
    ml: 'ml',
    piece: 'pc',
    packet: 'packet',
    bottle: 'bottle',
  }
  return labels[unit] || unit
}

/**
 * Get a compact label (good for table cells and badges).
 * Shows only the non-zero parts, with abbreviated units.
 *
 * @example
 * compactQuantity(3400, 'gram')   // → "3.4 kg"
 * compactQuantity(500, 'gram')    // → "500 g"
 * compactQuantity(1500, 'ml')     // → "1.5 L"
 * compactQuantity(26, 'piece')    // → "2.2 dozen"
 * compactQuantity(5, 'piece')     // → "5 pc"
 */
export function compactQuantity(qty: number, unit: string): string {
  const hierarchy = UNIT_HIERARCHY[unit]
  if (!hierarchy) {
    return `${qty} ${unit}`
  }

  const { factor, largerLabel, smallerLabel } = hierarchy
  if (qty >= factor) {
    return `${(qty / factor).toFixed(qty % factor === 0 ? 0 : 1)} ${largerLabel || hierarchy.largerUnit}`
  }

  return `${qty} ${smallerLabel || unit}`
}

/**
 * Get the larger-unit equivalent of a quantity.
 *
 * @example
 * toLargerUnit(3400, 'gram')  // → { value: 3.4, unit: 'kg' }
 * toLargerUnit(500, 'gram')   // → { value: 0.5, unit: 'kg' }
 */
export function toLargerUnit(
  qty: number,
  unit: string,
): { value: number; unit: string } {
  const hierarchy = UNIT_HIERARCHY[unit]
  if (!hierarchy) return { value: qty, unit }
  return { value: qty / hierarchy.factor, unit: hierarchy.largerLabel || hierarchy.largerUnit }
}
