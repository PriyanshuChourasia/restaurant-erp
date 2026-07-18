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
  recipes: {
    badge: 'bg-lime-600 text-white border-lime-700',
    icon: 'bg-lime-100 text-lime-600',
    dot: 'bg-lime-600',
  },
  recipe_ingredients: {
    badge: 'bg-lime-50 text-lime-700 border-lime-200',
    icon: 'bg-lime-100 text-lime-500',
    dot: 'bg-lime-500',
  },
  production_entries: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-600',
    dot: 'bg-emerald-500',
  },
} as const

const SCHEMA: TableSchema[] = [
  {
    table: 'recipes',
    description: 'Recipe/BOM header — defines output item and yield for a production batch',
    columns: [
      { name: 'id', type: 'uuid PK', nullable: false, default: null, description: 'Primary key' },
      { name: 'output_item_id', type: 'uuid FK UNIQUE', nullable: false, default: null, description: 'FK → items.id (item this recipe produces)' },
      { name: 'yield_quantity', type: 'decimal(10,3)', nullable: false, default: null, description: 'Output quantity per batch' },
      { name: 'yield_unit', type: 'enum(piece, kg, gram, litre, ...)', nullable: false, default: null, description: 'Output unit of measure' },
      { name: 'createdAt', type: 'timestamp', nullable: false, default: null, description: 'Auto-set creation timestamp' },
      { name: 'updatedAt', type: 'timestamp', nullable: false, default: null, description: 'Auto-set update timestamp' },
      { name: 'deletedAt', type: 'timestamp', nullable: true, default: null, description: 'Soft delete timestamp' },
    ],
    indices: ['idx_recipe_output_item (unique)'],
    relations: ['output_item_id → items.id', 'Referenced by recipe_ingredients.recipe_id', 'Referenced by production_entries.item_id'],
  },
  {
    table: 'recipe_ingredients',
    description: 'Recipe line items — defines component ingredients and quantities needed',
    columns: [
      { name: 'id', type: 'uuid PK', nullable: false, default: null, description: 'Primary key' },
      { name: 'recipe_id', type: 'uuid FK', nullable: false, default: null, description: 'FK → recipes.id (CASCADE delete)' },
      { name: 'component_item_id', type: 'uuid FK', nullable: false, default: null, description: 'FK → items.id (raw material/ingredient)' },
      { name: 'quantity', type: 'decimal(10,3)', nullable: false, default: null, description: 'Quantity needed' },
      { name: 'unit', type: 'enum(piece, kg, gram, litre, ...)', nullable: false, default: null, description: 'Unit of measure' },
    ],
    indices: ['idx_recipe_ingredient_recipe', 'idx_recipe_ingredient_unique (unique: recipe_id + component_item_id)'],
    relations: ['recipe_id → recipes.id (CASCADE)', 'component_item_id → items.id'],
  },
  {
    table: 'production_entries',
    description: 'Production log — records actual production runs (stock consumed + yield produced)',
    columns: [
      { name: 'id', type: 'uuid PK', nullable: false, default: null, description: 'Primary key' },
      { name: 'item_id', type: 'uuid FK', nullable: false, default: null, description: 'FK → items.id (item produced)' },
      { name: 'batch_quantity', type: 'decimal(10,3)', nullable: false, default: null, description: 'Quantity produced in this batch' },
      { name: 'produced_at', type: 'timestamp', nullable: false, default: 'CURRENT_TIMESTAMP', description: 'Production timestamp' },
      { name: 'created_by', type: 'uuid', nullable: true, default: null, description: 'FK → users.id (who produced it)' },
      { name: 'createdAt', type: 'timestamp', nullable: false, default: null, description: 'Auto-set creation timestamp' },
    ],
    indices: [],
    relations: ['item_id → items.id', 'created_by → users.id'],
  },
]

const TABLE_LINKS: Record<string, string> = {
  recipes: '/developer/tables/recipes',
  recipe_ingredients: '/developer/tables/recipe_ingredients',
  production_entries: '/developer/tables/production_entries',
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
        {col.default && <span className="text-[10px] font-mono text-gray-400">default: {col.default}</span>}
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
        <div className="flex items-center gap-1.5">{col.name}{badge && <KeyPill kind={badge} />}</div>
      </td>
      <td className="px-3 py-2"><code className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded whitespace-nowrap">{baseType}</code></td>
      <td className="px-3 py-2">{col.nullable ? <span className="text-[11px] text-amber-600 font-medium">Yes</span> : <span className="text-[11px] text-gray-400">No</span>}</td>
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

export function RecipeSchemaPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-600 text-white shadow-md shadow-lime-500/20 shrink-0">
            <Database size={16} className="sm:hidden" />
            <Database size={20} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight truncate">Recipe Schema</h1>
            <p className="text-[11px] sm:text-xs text-gray-400 truncate">3 tables · recipes → recipe_ingredients, production_entries</p>
          </div>
        </div>
      </div>

      {/* ERD Overview */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Link2 size={13} className="text-gray-400" />
          <h3 className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Relationship Diagram</h3>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:hidden">
          <ErdNode table="recipes" theme={THEME.recipes} />
          <div className="flex items-center gap-1.5 pl-3 text-[10px] text-gray-300 font-mono"><ChevronDown size={12} /> 1 ── N</div>
          <ErdNode table="recipe_ingredients" theme={THEME.recipe_ingredients} />
          <div className="flex items-center gap-1.5 pl-6 text-[10px] text-gray-300 font-mono">↓ also links to items</div>
          <ErdNode table="production_entries" theme={THEME.production_entries} />
        </div>
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          <ErdNode table="recipes" theme={THEME.recipes} />
          <span className="text-gray-300 text-xs font-mono">1 ── N</span>
          <ChevronRight size={16} className="text-gray-300" />
          <ErdNode table="recipe_ingredients" theme={THEME.recipe_ingredients} />
          <span className="text-gray-300 text-xs font-mono">|</span>
          <ErdNode table="production_entries" theme={THEME.production_entries} />
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-medium mb-2">Connected to:</p>
          <div className="flex flex-wrap gap-1.5">
            {['items (output + ingredients)', 'users (created_by)'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 border border-gray-200 text-[10px] font-mono text-gray-500">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {SCHEMA.map((table) => {
        const theme = THEME[table.table as keyof typeof THEME]
        const link = TABLE_LINKS[table.table]
        return (
          <div key={table.table} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3.5 sm:px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md sm:rounded-lg shrink-0 ${theme.icon}`}><Table2 size={12} /></div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 font-mono truncate">{table.table}</h3>
                <span className="text-[9px] sm:text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded shrink-0">{table.columns.length} cols</span>
              </div>
              {link && <Link to={link} className="flex items-center gap-0.5 text-[10px] sm:text-[11px] text-lime-600 hover:text-lime-800 font-medium shrink-0">View data <ArrowUpRight size={11} /></Link>}
            </div>
            <div className="px-3.5 sm:px-4 py-2 border-b border-gray-50 bg-gray-50/50"><p className="text-[11px] sm:text-xs text-gray-500">{table.description}</p></div>
            <div className="sm:hidden divide-y divide-gray-50">{table.columns.map((col) => <ColumnCard key={col.name} col={col} />)}</div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-gray-100">
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Column</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Type</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Nullable</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Default</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Description</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">{table.columns.map((col) => <ColumnRow key={col.name} col={col} />)}</tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-3.5 sm:px-4 py-2.5 bg-gray-50/50 space-y-1.5">
              {table.indices.length > 0 && (
                <div className="flex items-start gap-2 text-[11px]">
                  <span className="font-medium text-gray-400 shrink-0">Indices:</span>
                  <div className="flex flex-wrap gap-1">{table.indices.map((idx) => <code key={idx} className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded break-all">{idx}</code>)}</div>
                </div>
              )}
              {table.relations.length > 0 && (
                <div className="flex items-start gap-2 text-[11px]">
                  <span className="font-medium text-gray-400 shrink-0">Relations:</span>
                  <div className="flex flex-wrap gap-1">{table.relations.map((rel) => <code key={rel} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded break-all">{rel}</code>)}</div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      <div className="rounded-2xl border border-lime-200 bg-lime-50 p-4 sm:p-5">
        <p className="text-[11px] sm:text-xs text-lime-700 leading-relaxed">
          <span className="font-semibold">Note:</span> The database is managed with TypeORM{' '}
          <code className="mx-1 text-[10px] sm:text-[11px] bg-lime-100 px-1 py-0.5 rounded">synchronize: true</code>
          (dev mode). This schema is auto-generated from the entity classes in{' '}
          <code className="ml-1 text-[10px] sm:text-[11px] bg-lime-100 px-1 py-0.5 rounded break-all">apps/api/src/recipes/entities/</code>.
        </p>
      </div>
    </div>
  )
}
