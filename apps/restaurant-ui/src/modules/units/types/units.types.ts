export interface Unit {
  id: string
  superKey: number
  symbol: string
  name: string
  description: string | null
  baseUnitId: string | null
  conversionFactor: number
  decimalAllowed: boolean
  isActive: boolean
}

export interface ConversionResult {
  quantity: number
  from: string
  to: string
  result: number
}
