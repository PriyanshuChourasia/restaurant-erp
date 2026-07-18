import { Link } from '@tanstack/react-router'
import { Database, Table2, Link2, ChevronRight, ChevronDown, KeyRound, ArrowUpRight } from 'lucide-react'

type Column = { name: string; type: string; nullable: boolean; default: string | null; description: string }

type TableSchema = {
  table: string
  description: string
  columns: Column[]
  indices: string[]
  relations: string[]
}

const THEME = {
  orders: {
    badge: 'bg-blue-600 text-white border-blue-700',
    icon: 'bg-blue-100 text-blue-600',
    dot: 'bg-blue-600',
  },
  order_items: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: 'bg-blue-100 text-blue-500',
    dot: 'bg-blue-500',
  },
} as const

const SCHEMA: TableSchema[] = [
  {
    table: 'orders',
    description: 'Order header — tracks customer orders with type, fulfillment method, status, and totals',
    columns: [
      { name: 'id', type: 'uuid PK', nullable: false, default: null, description: 'Primary key' },
      { name: 'order_number', type: 'varchar(50) UNIQUE', nullable: false, default: null, description: 'Generated order number (e.g. ORD-2026-001)' },
      { name: 'order_type', type: 'enum(regular, party, scheduled)', nullable: false, default: "'regular'", description: 'Order classification' },
      { name: 'fulfillment_method', type: 'enum(dine_in, takeaway, delivery)', nullable: false, default: "'dine_in'", description: 'Service method' },
      { name: 'status', type: 'enum(pending_confirmation, confirmed, billed, cancelled)', nullable: false, default: "'pending_confirmation'", description: 'Order status' },
      { name: 'customer_name', type: 'varchar(255)', nullable: true, default: null, description: 'Walk-in customer name' },
      { name: 'customer_phone', type: 'varchar(20)', nullable: true, default: null, description: 'Walk-in customer phone' },
      { name: 'customer_gstin', type: 'varchar(20)', nullable: true, default: null, description: 'Customer GSTIN' },
      { name: 'customer_id', type: 'uuid FK', nullable: true, default: null, description: 'FK → customers.id (registered customer)' },
      { name: 'table_ids', type: 'json', nullable: true, default: null, description: 'Assigned table IDs (array)' },
      { name: 'reservation_id', type: 'uuid', nullable: true, default: null, description: 'FK → reservations.id' },
      { name: 'scheduled_for', type: 'timestamp', nullable: true, default: null, description: 'Scheduled order time' },
      { name: 'party_size', type: 'int', nullable: true, default: null, description: 'Number of guests' },
      { name: 'discount_percent', type: 'decimal(5,2)', nullable: true, default: null, description: 'Discount percentage' },
      { name: 'subtotal', type: 'decimal(14,2)', nullable: false, default: '0', description: 'Subtotal before tax' },
      { name: 'cgst_total', type: 'decimal(14,2)', nullable: false, default: '0', description: 'Total CGST' },
      { name: 'sgst_total', type: 'decimal(14,2)', nullable: false, default: '0', description: 'Total SGST' },
      { name: 'tax_total', type: 'decimal(14,2)', nullable: false, default: '0', description: 'Total tax' },
      { name: 'grand_total', type: 'decimal(14,2)', nullable: false, default: '0', description: 'Grand total' },
      { name: 'notes', type: 'text', nullable: true, default: null, description: 'Order notes' },
      { name: 'invoice_id', type: 'uuid', nullable: true, default: null, description: 'FK → sales_invoices.id (when billed)' },
      { name: 'kot_sent', type: 'boolean', nullable: false, default: 'false', description: 'Whether KOT sent to kitchen' },
      { name: 'created_by', type: 'uuid', nullable: true, default: null, description: 'FK → users.id (creator)' },
      { name: 'createdAt', type: 'timestamp', nullable: false, default: null, description: 'Auto-set creation timestamp' },
      { name: 'updatedAt', type: 'timestamp', nullable: false, default: null, description: 'Auto-set update timestamp' },
    ],
    indices: ['idx_order_status', 'idx_order_type', 'idx_order_scheduled_for'],
    relations: ['customer_id → customers.id', 'reservation_id → reservations.id', 'invoice_id → sales_invoices.id', 'created_by → users.id', 'Referenced by order_items.order_id', 'Referenced by kots.order_id'],
  },
  {
    table: 'order_items',
    description: 'Line items — individual items within an order with pricing and tax details',
    columns: [
      { name: 'id', type: 'uuid PK', nullable: false, default: null, description: 'Primary key' },
      { name: 'order_id', type: 'uuid FK', nullable: false, default: null, description: 'FK → orders.id (CASCADE delete)' },
      { name: 'item_id', type: 'uuid', nullable: false, default: null, description: 'FK → items.id' },
      { name: 'item_name', type: 'varchar(255)', nullable: false, default: null, description: 'Item name (denormalized)' },
      { name: 'hsn_code', type: 'varchar(20)', nullable: false, default: null, description: 'HSN code' },
      { name: 'quantity', type: 'decimal(10,2)', nullable: false, default: null, description: 'Quantity ordered' },
      { name: 'unit_price', type: 'decimal(12,2)', nullable: false, default: null, description: 'Unit price' },
      { name: 'taxable_value', type: 'decimal(12,2)', nullable: false, default: null, description: 'Taxable value' },
      { name: 'gst_rate', type: 'decimal(5,2)', nullable: false, default: null, description: 'GST rate %' },
      { name: 'cgst_amount', type: 'decimal(12,2)', nullable: false, default: null, description: 'CGST amount' },
      { name: 'sgst_amount', type: 'decimal(12,2)', nullable: false, default: null, description: 'SGST amount' },
      { name: 'total_amount', type: 'decimal(12,2)', nullable: false, default: null, description: 'Line total' },
    ],
    indices: [],
    relations: ['order_id → orders.id (CASCADE)', 'item_id → items.id'],
  },
]

const TABLE_LINKS: Record<string, string> = {
  orders: '/developer/tables/orders',
  order_items: '/developer/tables/order_items',
}

function keyBadge(type: string): 'PK' | 'FK' | 'UNIQUE' | null {
  if (type.includes('PK')) return 'PK'
  if (type.includes('FK')) return 'FK'
  if (type.includes('UNIQUE')) return 'UNIQUE'
  return null
}

function KeyPill({ kind }: { kind: 'PK' | 'FK' | 'UNIQUE' }) {
  const styles = {
    PK: 'bg-amber-50 text-amber-700 border-amber-200',
    FK: 'bg-sky-50 text-sky-700 border-sky-200',
    UNIQUE: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  } as const
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded border shrink-0 ${styles[kind]}`}>
      {kind === 'PK' && <KeyRound size={8} />}
      {kind}
    </span>
  )
}

function ColumnCard({ col }: { col: Column }) {
  const badge = keyBadge(col.type)
  const baseType = col.type.replace(/ (PK|FK|UNIQUE)$/, '')
  return (
    <div className="p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="font-mono text-xs font-semibold text-gray-800 break-all">{col.name}</span>
          {badge && <KeyPill kind={badge} />}
        </div>
        {col.nullable && (
          <span className="text-[9px] text-amber-600 font-medium shrink-0 bg-amber-50 border border-amber-200 rounded px-1 py-0.5">nullable</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <code className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{baseType}</code>
        {col.default && (
          <span className="text-[10px] font-mono text-gray-400">default: {col.default}</span>
        )}
      </div>
      {col.description && <p className="text-[11px] text-gray-500 leading-snug">{col.description}</p>}
    </div>
  )
}

function ColumnRow({ col }: { col: Column }) {
  const badge = keyBadge(col.type)
  const baseType = col.type.replace(/ (PK|FK|UNIQUE)$/, '')
  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-3 py-2 font-mono text-xs text-gray-800 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {col.name}
          {badge && <KeyPill kind={badge} />}
        </div>
      </td>
      <td className="px-3 py-2">
        <code className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded whitespace-nowrap">{baseType}</code>
      </td>
      <td className="px-3 py-2">
        {col.nullable
          ? <span className="text-[11px] text-amber-600 font-medium">Yes</span>
          : <span className="text-[11px] text-gray-400">No</span>
        }
      </td>
      <td className="px-3 py-2 font-mono text-[11px] text-gray-400 whitespace-nowrap">{col.default || '—'}</td>
      <td className="px-3 py-2 text-xs text-gray-500 min-w-[160px]">{col.description}</td>
    </tr>
  )
}

function ErdNode({ table, theme }: { table: string; theme: (typeof THEME)[keyof typeof THEME] }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-xs font-semibold ${theme.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
      {table}
    </span>
  )
}

export function OrderSchemaPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/20 shrink-0">
            <Database size={16} className="sm:hidden" />
            <Database size={20} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight truncate">Order Schema</h1>
            <p className="text-[11px] sm:text-xs text-gray-400 truncate">2 tables · orders → order_items</p>
          </div>
        </div>
      </div>

      {/* ERD Overview */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Link2 size={13} className="text-gray-400" />
          <h3 className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Relationship Diagram</h3>
        </div>
        {/* Mobile: vertical flow */}
        <div className="flex flex-col items-start gap-1.5 sm:hidden">
          <ErdNode table="orders" theme={THEME.orders} />
          <div className="flex items-center gap-1.5 pl-3 text-[10px] text-gray-300 font-mono">
            <ChevronDown size={12} /> 1 ── N
          </div>
          <ErdNode table="order_items" theme={THEME.order_items} />
        </div>
        {/* Desktop: horizontal flow */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          <ErdNode table="orders" theme={THEME.orders} />
          <span className="text-gray-300 text-xs font-mono">1 ── N</span>
          <ChevronRight size={16} className="text-gray-300" />
          <ErdNode table="order_items" theme={THEME.order_items} />
        </div>
        {/* Connections */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-medium mb-2">Connected to:</p>
          <div className="flex flex-wrap gap-1.5">
            {['customers', 'reservations', 'items', 'users', 'sales_invoices', 'kots'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 border border-gray-200 text-[10px] font-mono text-gray-500">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Schema Tables */}
      {SCHEMA.map((table) => {
        const theme = THEME[table.table as keyof typeof THEME]
        const link = TABLE_LINKS[table.table]
        return (
          <div key={table.table} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3.5 sm:px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md sm:rounded-lg shrink-0 ${theme.icon}`}>
                  <Table2 size={12} />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 font-mono truncate">{table.table}</h3>
                <span className="text-[9px] sm:text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded shrink-0">{table.columns.length} cols</span>
              </div>
              {link && (
                <Link to={link} className="flex items-center gap-0.5 text-[10px] sm:text-[11px] text-blue-600 hover:text-blue-800 font-medium shrink-0">
                  View data <ArrowUpRight size={11} />
                </Link>
              )}
            </div>
            <div className="px-3.5 sm:px-4 py-2 border-b border-gray-50 bg-gray-50/50">
              <p className="text-[11px] sm:text-xs text-gray-500">{table.description}</p>
            </div>
            <div className="sm:hidden divide-y divide-gray-50">
              {table.columns.map((col) => <ColumnCard key={col.name} col={col} />)}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Column</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Type</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Nullable</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Default</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {table.columns.map((col) => <ColumnRow key={col.name} col={col} />)}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-3.5 sm:px-4 py-2.5 bg-gray-50/50 space-y-1.5">
              {table.indices.length > 0 && (
                <div className="flex items-start gap-2 text-[11px]">
                  <span className="font-medium text-gray-400 shrink-0">Indices:</span>
                  <div className="flex flex-wrap gap-1">
                    {table.indices.map((idx) => <code key={idx} className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded break-all">{idx}</code>)}
                  </div>
                </div>
              )}
              {table.relations.length > 0 && (
                <div className="flex items-start gap-2 text-[11px]">
                  <span className="font-medium text-gray-400 shrink-0">Relations:</span>
                  <div className="flex flex-wrap gap-1">
                    {table.relations.map((rel) => <code key={rel} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded break-all">{rel}</code>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
        <p className="text-[11px] sm:text-xs text-blue-700 leading-relaxed">
          <span className="font-semibold">Note:</span> The database is managed with TypeORM{' '}
          <code className="mx-1 text-[10px] sm:text-[11px] bg-blue-100 px-1 py-0.5 rounded">synchronize: true</code>
          (dev mode). This schema is auto-generated from the entity classes in{' '}
          <code className="ml-1 text-[10px] sm:text-[11px] bg-blue-100 px-1 py-0.5 rounded break-all">apps/api/src/orders/entities/</code>.
        </p>
      </div>
    </div>
  )
}
