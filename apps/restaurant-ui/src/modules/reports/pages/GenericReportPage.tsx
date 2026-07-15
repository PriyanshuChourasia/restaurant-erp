import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { getReportConfig } from '../configs'
import { ReportPageLayout } from '../components/report-framework/ReportPageLayout'
import { ReportKpiGrid } from '../components/report-framework/ReportKpiGrid'
import { ReportDataTable } from '../components/report-framework/ReportDataTable'
import { useGenericReport } from '../hooks/useGenericReport'

interface GenericReportPageProps {
  reportId: string
}

export function GenericReportPage({ reportId }: GenericReportPageProps) {
  const navigate = useNavigate()
  const config = getReportConfig(reportId)

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Report Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">No configuration found for "{reportId}"</p>
        <button
          onClick={() => navigate({ to: '/reports' })}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} /> Back to Reports
        </button>
      </div>
    )
  }

  return (
    <ReportPageLayout
      title={config.title}
      description={config.description}
      icon={config.icon}
      iconBg={config.iconBg}
      defaultPreset={config.defaultPreset}
    >
      {(fromDate: string, toDate: string) => (
        <ReportPageContent config={config} fromDate={fromDate} toDate={toDate} />
      )}
    </ReportPageLayout>
  )
}

function ReportPageContent({ config, fromDate, toDate }: { config: import('../types/report-config.types').ReportConfig; fromDate: string; toDate: string }) {
  const { data, isLoading } = useGenericReport(config.endpoint, fromDate, toDate)

  const kpiData = data as Record<string, any> | null | undefined

  const resolveNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => {
      if (acc && typeof acc === 'object') return acc[part]
      return undefined
    }, obj)
  }

  const mappedKpis = config.kpis.map((kpi) => ({
    ...kpi,
    resolvedValue: resolveNestedValue(kpiData, kpi.dataKey),
  }))

  const rows = (() => {
    if (!data) return []
    const items = (data as any).items
    return Array.isArray(items) ? items : []
  })()

  const rowData = Array.isArray(rows) ? rows : []

  return (
    <div className="space-y-6">
      <ReportKpiGrid
        data={Object.fromEntries(mappedKpis.map((k) => [k.dataKey, k.resolvedValue]))}
        configs={config.kpis}
        isLoading={isLoading}
      />

      {!config.noTable && config.columns && config.columns.length > 0 && (
        <ReportDataTable
          data={rowData}
          columns={config.columns}
          isLoading={isLoading}
          searchable={config.searchable}
          searchFields={config.searchFields}
          emptyTitle={isLoading ? 'Loading...' : 'No data available'}
          emptyDescription={
            isLoading
              ? 'Fetching report data...'
              : `This report's backend endpoint is not yet implemented. Data will appear once ${config.endpoint} is built.`
          }
        />
      )}
    </div>
  )
}
