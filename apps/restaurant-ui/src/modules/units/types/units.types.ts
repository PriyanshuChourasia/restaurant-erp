export interface Unit {
  id: string
  code: string
  name: string
  unitType: 'weight' | 'volume' | 'count'
  isBaseUnit: boolean
  isActive: boolean
}

export interface ConversionResult {
  quantity: number
  from: string
  to: string
  result: number
}
