import type { ReportConfig } from '../types/report-config.types'
import { inventoryReports } from './inventory.config'
import { financialReports } from './financial.config'
import { kitchenReports } from './kitchen.config'
import { customerReports } from './customer.config'
import { reservationReports } from './reservation.config'
import { procurementReports } from './procurement.config'
import { operationalReports } from './operational.config'
import { executiveReports } from './executive.config'

export const ALL_REPORT_CONFIGS: ReportConfig[] = [
  ...inventoryReports,
  ...financialReports,
  ...kitchenReports,
  ...customerReports,
  ...reservationReports,
  ...procurementReports,
  ...operationalReports,
  ...executiveReports,
]

export const REPORT_CONFIG_BY_ID: Map<string, ReportConfig> = new Map(
  ALL_REPORT_CONFIGS.map((r) => [r.id, r]),
)

export const REPORT_CATEGORIES = [
  { key: 'inventory', label: 'Inventory & Stock', reports: inventoryReports },
  { key: 'financial', label: 'Financial & Accounting', reports: financialReports },
  { key: 'kitchen', label: 'Kitchen Operations', reports: kitchenReports },
  { key: 'customer', label: 'Customer Analytics', reports: customerReports },
  { key: 'reservation', label: 'Reservations & Seating', reports: reservationReports },
  { key: 'procurement', label: 'Procurement & Suppliers', reports: procurementReports },
  { key: 'operations', label: 'Daily Operations', reports: operationalReports },
  { key: 'executive', label: 'Executive Dashboard', reports: executiveReports },
]

export function getReportConfig(id: string): ReportConfig | undefined {
  return REPORT_CONFIG_BY_ID.get(id)
}

export function getAllReports(): ReportConfig[] {
  return ALL_REPORT_CONFIGS
}
