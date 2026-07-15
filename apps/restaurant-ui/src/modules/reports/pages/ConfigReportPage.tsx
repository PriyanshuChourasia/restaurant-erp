import { GenericReportPage } from './GenericReportPage'

interface ConfigReportPageProps {
  reportId: string
}

export function ConfigReportPage({ reportId }: ConfigReportPageProps) {
  return <GenericReportPage reportId={reportId} />
}
