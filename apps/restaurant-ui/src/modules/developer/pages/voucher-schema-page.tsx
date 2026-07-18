import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Table2, Link2, ChevronRight, ChevronDown, KeyRound, ArrowUpRight, Eye, EyeOff } from 'lucide-react'

type Column = { name: string; type: string; nullable: boolean; default: string | null; description: string }

type TableSchema = {
  table: string
  description: string
  columns: Column[]
  indices: string[]
  relations: string[]
}

const THEME = {
  voucher_modules: {
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: 'bg-violet-100 text-violet-600',
    dot: 'bg-violet-500',
    glow: 'shadow-violet-500/10',
    ring: 'ring-violet-200',
  },
  voucher_types: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    dot: 'bg-blue-500',
    glow: 'shadow-blue-500/10',
    ring: 'ring-blue-200',
  },
  vouchers: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-600',
    dot: 'bg-emerald-500',
    glow: 'shadow-emerald-500/10',
    ring: 'ring-emerald-200',
  },
} as const

const SCHEMA: TableSchema[] = [
  {
    table: 'voucher_modules',
    description: 'Lookup table — categorizes voucher types by subsystem (Accounting, Inventory, Sales, Purchase)',
    columns: [
      { name: 'id', type: 'uuid PK', nullable: false, default: null, description: 'Primary key' },
      { name: 'super_key', type: 'bigint UNIQUE', nullable: false, default: null, description: 'Business-facing sequential ID' },
      { name: 'code', type: 'varchar(30) UNIQUE', nullable: false, default: null, description: 'Stable logical code (e.g. accounting, inventory)' },
      { name: 'name', type: 'varchar(100)', nullable: false, default: null, description: 'Display name' },
      { name: 'description', type: 'text', nullable: true, default: null, description: 'Optional description' },
      { name: 'display_order', type: 'integer', nullable: false, default: '0', description: 'Sort order' },
      { name: 'is_system', type: 'boolean', nullable: false, default: 'true', description: 'System-defined module' },
      { name: 'is_active', type: 'boolean', nullable: false, default: 'true', description: 'Active flag' },
      { name: 'createdAt', type: 'timestamp', nullable: false, default: null, description: 'Auto-set creation timestamp' },
      { name: 'updatedAt', type: 'timestamp', nullable: false, default: null, description: 'Auto-set update timestamp' },
    ],
    indices: ['idx_vm_code (unique)', 'idx_vm_active'],
    relations: ['Referenced by voucher_types.voucher_module_id'],
  },
  {
    table: 'voucher_types',
    description: 'Master data — defines voucher categories (Payment, Receipt, Journal, Credit Note, Debit Note, etc.)',
    columns: [
      { name: 'id', type: 'uuid PK', nullable: false, default: null, description: 'Primary key' },
      { name: 'super_key', type: 'bigint UNIQUE', nullable: false, default: null, description: 'Business-facing sequential ID' },
      { name: 'code', type: 'varchar(30) UNIQUE', nullable: false, default: null, description: 'Stable code (payment, receipt, journal, etc.)' },
      { name: 'name', type: 'varchar(100)', nullable: false, default: null, description: 'Display name' },
      { name: 'voucher_module_id', type: 'uuid FK', nullable: false, default: null, description: 'FK → voucher_modules.id' },
      { name: 'affects_accounts', type: 'boolean', nullable: false, default: 'false', description: 'Affects accounting ledger' },
      { name: 'affects_inventory', type: 'boolean', nullable: false, default: 'false', description: 'Affects inventory stock' },
      { name: 'affects_tax', type: 'boolean', nullable: false, default: 'false', description: 'Affects tax calculations' },
      { name: 'is_system', type: 'boolean', nullable: false, default: 'true', description: 'System-defined type' },
      { name: 'is_active', type: 'boolean', nullable: false, default: 'true', description: 'Active flag' },
      { name: 'description', type: 'text', nullable: true, default: null, description: 'Optional description' },
      { name: 'createdAt', type: 'timestamp', nullable: false, default: null, description: 'Auto-set creation timestamp' },
      { name: 'updatedAt', type: 'timestamp', nullable: false, default: null, description: 'Auto-set update timestamp' },
    ],
    indices: ['idx_vt_code (unique)', 'idx_vt_active', 'idx_vt_module'],
    relations: ['voucher_module_id → voucher_modules.id', 'Referenced by vouchers.voucher_type_id'],
  },
  {
    table: 'vouchers',
    description: 'Transactional — actual voucher records linked to journal entries and optionally to invoices',
    columns: [
      { name: 'id', type: 'uuid PK', nullable: false, default: null, description: 'Primary key' },
      { name: 'voucher_number', type: 'varchar(50) UNIQUE', nullable: false, default: null, description: 'Unique voucher reference number' },
      { name: 'voucher_type_id', type: 'uuid FK', nullable: true, default: null, description: 'FK → voucher_types.id (nullable for legacy data)' },
      { name: 'status', type: 'enum(posted, cancelled)', nullable: false, default: "'posted'", description: 'Current voucher status' },
      { name: 'voucher_date', type: 'date', nullable: false, default: null, description: 'Date of the voucher' },
      { name: 'party_type', type: 'varchar(50)', nullable: true, default: null, description: 'Type of party (customer/supplier/etc)' },
      { name: 'party_id', type: 'uuid', nullable: true, default: null, description: 'Reference to the party' },
      { name: 'payment_mode', type: 'varchar(20)', nullable: true, default: null, description: 'Mode of payment (cash/bank/etc)' },
      { name: 'amount', type: 'decimal(14,2)', nullable: false, default: null, description: 'Voucher amount' },
      { name: 'narration', type: 'text', nullable: true, default: null, description: 'Internal note / narration' },
      { name: 'journal_entry_id', type: 'uuid FK', nullable: false, default: null, description: 'FK → journal_entries.id' },
      { name: 'reference_invoice_id', type: 'uuid', nullable: true, default: null, description: 'Optional linked invoice' },
      { name: 'created_by', type: 'uuid', nullable: true, default: null, description: 'User who created the voucher' },
      { name: 'createdAt', type: 'timestamp', nullable: false, default: null, description: 'Auto-set creation timestamp' },
    ],
    indices: ['idx_voucher_type', 'idx_voucher_date', 'idx_voucher_reference_invoice', 'voucher_number (unique)'],
    relations: ['voucher_type_id → voucher_types.id', 'journal_entry_id → journal_entries.id', 'reference_invoice_id → sales_invoices.id (optional)'],
  },
]

const TABLE_LINKS: Record<string, string> = {
  voucher_modules: '/developer/tables/voucher_modules',
  voucher_types: '/developer/tables/voucher_types',
  vouchers: '/developer/tables/vouchers',
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
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
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded border shrink-0 ${styles[kind]}`}
    >
      {kind === 'PK' && <KeyRound size={8} />}
      {kind}
    </motion.span>
  )
}

function ColumnCard({ col, index }: { col: Column; index: number }) {
  const badge = keyBadge(col.type)
  const baseType = col.type.replace(/ (PK|FK|UNIQUE)$/, '')
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay: index * 0.03, duration: 0.3 }}
      whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.03)' }}
      className="p-3 space-y-1.5 cursor-default"
    >
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
    </motion.div>
  )
}

function ColumnRow({ col, index }: { col: Column; index: number }) {
  const badge = keyBadge(col.type)
  const baseType = col.type.replace(/ (PK|FK|UNIQUE)$/, '')
  return (
    <motion.tr
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ delay: index * 0.02, duration: 0.25 }}
      whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.03)' }}
      className="cursor-default"
    >
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
    </motion.tr>
  )
}

function ErdNode({ table, theme, index }: { table: string; theme: (typeof THEME)[keyof typeof THEME]; index: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.2, type: 'spring', stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-xs font-semibold ${theme.badge} cursor-default`}
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 + index * 0.2, type: 'spring', stiffness: 300 }}
        className={`h-1.5 w-1.5 rounded-full ${theme.dot}`}
      />
      {table}
    </motion.span>
  )
}

function FlowArrow({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ delay: 0.5 + index * 0.2, duration: 0.4 }}
      className="flex items-center gap-2"
    >
      <div className="relative">
        <div className="h-px w-8 bg-gradient-to-r from-gray-300 to-gray-200" />
        <motion.div
          initial={{ x: -8 }}
          animate={{ x: 8 }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5, ease: 'easeInOut' }}
          className="absolute top-1/2 -translate-y-1/2 left-0 w-1.5 h-1.5 rounded-full bg-violet-400"
        />
      </div>
      <span className="text-gray-300 text-[10px] font-mono whitespace-nowrap">1 ── N</span>
      <ChevronRight size={14} className="text-gray-300" />
    </motion.div>
  )
}

function FlowArrowMobile({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ delay: 0.5 + index * 0.2, duration: 0.4 }}
      className="flex items-center gap-1.5 pl-3 text-[10px] text-gray-300 font-mono"
    >
      <div className="relative h-6 w-px">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-300 to-gray-200" />
        <motion.div
          initial={{ y: -4 }}
          animate={{ y: 8 }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5, ease: 'easeInOut' }}
          className="absolute left-1/2 -translate-x-1/2 top-0 w-1.5 h-1.5 rounded-full bg-violet-400"
        />
      </div>
      <ChevronDown size={12} /> 1 ── N
    </motion.div>
  )
}

export function VoucherSchemaPage() {
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    voucher_modules: true,
    voucher_types: true,
    vouchers: true,
  })

  const toggleTable = (table: string) => {
    setExpandedTables((prev) => ({ ...prev, [table]: !prev[table] }))
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-5 sm:space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex items-center gap-3"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
            className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20 shrink-0"
          >
            <Database size={16} className="sm:hidden" />
            <Database size={20} className="hidden sm:block" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight truncate">Voucher Schema</h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[11px] sm:text-xs text-gray-400 truncate"
            >
              3 tables · voucher_modules → voucher_types → vouchers
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* ERD Overview */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5"
      >
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Link2 size={13} className="text-gray-400" />
          <h3 className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Relationship Diagram</h3>
        </div>
        {/* Mobile: vertical flow */}
        <div className="flex flex-col items-start gap-1.5 sm:hidden">
          <ErdNode table="voucher_modules" theme={THEME.voucher_modules} index={0} />
          <FlowArrowMobile index={0} />
          <ErdNode table="voucher_types" theme={THEME.voucher_types} index={1} />
          <FlowArrowMobile index={1} />
          <ErdNode table="vouchers" theme={THEME.vouchers} index={2} />
        </div>
        {/* Desktop: horizontal flow */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          <ErdNode table="voucher_modules" theme={THEME.voucher_modules} index={0} />
          <FlowArrow index={0} />
          <ErdNode table="voucher_types" theme={THEME.voucher_types} index={1} />
          <FlowArrow index={1} />
          <ErdNode table="vouchers" theme={THEME.vouchers} index={2} />
        </div>
      </motion.div>

      {/* Schema Tables */}
      <div className="space-y-4">
        {SCHEMA.map((table, tableIndex) => {
          const theme = THEME[table.table as keyof typeof THEME]
          const link = TABLE_LINKS[table.table]
          const isExpanded = expandedTables[table.table]

          return (
            <motion.div
              key={table.table}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + tableIndex * 0.12, duration: 0.5, ease: 'easeOut' }}
              className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
            >
              {/* Table Header — clickable to expand/collapse */}
              <motion.button
                onClick={() => toggleTable(table.table)}
                whileHover={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}
                whileTap={{ scale: 0.998 }}
                className="w-full flex items-center justify-between gap-2 px-3.5 sm:px-4 py-3 border-b border-gray-100 bg-gray-50 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <motion.div
                    animate={{ rotate: isExpanded ? 0 : -90 }}
                    transition={{ duration: 0.25 }}
                    className="text-gray-400 shrink-0"
                  >
                    <ChevronDown size={14} />
                  </motion.div>
                  <div className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md sm:rounded-lg shrink-0 ${theme.icon}`}>
                    <Table2 size={12} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 font-mono truncate">{table.table}</h3>
                  <span className="text-[9px] sm:text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded shrink-0">{table.columns.length} cols</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isExpanded ? (
                    <Eye size={13} className="text-gray-400" />
                  ) : (
                    <EyeOff size={13} className="text-gray-300" />
                  )}
                  {link && (
                    <Link
                      to={link}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-0.5 text-[10px] sm:text-[11px] text-violet-600 hover:text-violet-800 font-medium"
                    >
                      View data <ArrowUpRight size={11} />
                    </Link>
                  )}
                </div>
              </motion.button>

              {/* Description */}
              <div className="px-3.5 sm:px-4 py-2 border-b border-gray-50 bg-gray-50/50">
                <p className="text-[11px] sm:text-xs text-gray-500">{table.description}</p>
              </div>

              {/* Columns — animated expand/collapse */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    {/* Cards on mobile */}
                    <motion.div
                      className="sm:hidden divide-y divide-gray-50"
                      variants={stagger}
                      initial="initial"
                      animate="animate"
                    >
                      {table.columns.map((col, i) => (
                        <ColumnCard key={col.name} col={col} index={i} />
                      ))}
                    </motion.div>
                    {/* Table on desktop */}
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
                        <motion.tbody
                          className="divide-y divide-gray-50"
                          variants={stagger}
                          initial="initial"
                          animate="animate"
                        >
                          {table.columns.map((col, i) => (
                            <ColumnRow key={col.name} col={col} index={i} />
                          ))}
                        </motion.tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Indices & Relations — always visible */}
              <motion.div
                className="border-t border-gray-100 px-3.5 sm:px-4 py-2.5 bg-gray-50/50 space-y-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {table.indices.length > 0 && (
                  <div className="flex items-start gap-2 text-[11px]">
                    <span className="font-medium text-gray-400 shrink-0">Indices:</span>
                    <div className="flex flex-wrap gap-1">
                      {table.indices.map((idx, i) => (
                        <motion.code
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.05 }}
                          className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded break-all"
                        >
                          {idx}
                        </motion.code>
                      ))}
                    </div>
                  </div>
                )}
                {table.relations.length > 0 && (
                  <div className="flex items-start gap-2 text-[11px]">
                    <span className="font-medium text-gray-400 shrink-0">Relations:</span>
                    <div className="flex flex-wrap gap-1">
                      {table.relations.map((rel, i) => (
                        <motion.code
                          key={rel}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.05 }}
                          className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded break-all"
                        >
                          {rel}
                        </motion.code>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        whileHover={{ scale: 1.005 }}
        className="rounded-2xl border border-violet-200 bg-violet-50 p-4 sm:p-5"
      >
        <p className="text-[11px] sm:text-xs text-violet-700 leading-relaxed">
          <span className="font-semibold">Note:</span> The database is managed with TypeORM{' '}
          <code className="mx-1 text-[10px] sm:text-[11px] bg-violet-100 px-1 py-0.5 rounded">synchronize: true</code>
          (dev mode). No migration files are used. This schema is auto-generated from the entity classes in{' '}
          <code className="ml-1 text-[10px] sm:text-[11px] bg-violet-100 px-1 py-0.5 rounded break-all">apps/api/src/vouchers/entities/</code>.
        </p>
      </motion.div>
    </motion.div>
  )
}
