import { HeartPulse, TrendingUp, BarChart3, Users, RefreshCw } from 'lucide-react'
import { useHealthScorecard } from '../hooks/useReportQueries'
import { ReportPageHeader, LoadingSkeleton } from '../components/ReportComponents'

const SCORE_COLORS = [
  { min: 80, color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excellent' },
  { min: 60, color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Good' },
  { min: 40, color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', label: 'Fair' },
  { min: 0, color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Critical' },
]

function getScoreLevel(score: number) {
  return SCORE_COLORS.find((c) => score >= c.min) || SCORE_COLORS[SCORE_COLORS.length - 1]
}

const CATEGORY_ICONS: Record<string, typeof BarChart3> = {
  Financial: BarChart3,
  Operational: TrendingUp,
  Customer: Users,
  Compliance: HeartPulse,
}

export function HealthScorecardPage() {
  const { data, isLoading, isFetching, refetch } = useHealthScorecard()

  const categories = [
    { label: 'Financial', key: 'financialScore', icon: BarChart3 },
    { label: 'Operational', key: 'operationalScore', icon: TrendingUp },
    { label: 'Customer', key: 'customerScore', icon: Users },
  ]

  return (
    <div className="space-y-6">
      <ReportPageHeader
        title="Business Health Scorecard"
        description="Weighted score across financial, operational, customer, and compliance health"
        icon={HeartPulse}
        iconColor="bg-rose-600"
      >
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </ReportPageHeader>

      {isLoading ? (
        <LoadingSkeleton rows={4} type="cards" />
      ) : data ? (
        <>
          {/* Overall Score */}
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <HeartPulse size={32} className="mx-auto text-rose-500 mb-3" />
            <h2 className="text-sm font-medium text-gray-500 mb-1">Overall Health Score</h2>
            <div className="relative inline-flex items-center justify-center mb-3">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke={getScoreLevel(data.overallScore).color.replace('bg-', '')}
                  strokeWidth="8"
                  strokeDasharray={`${(data.overallScore / 100) * 339.292} 339.292`}
                  strokeLinecap="round"
                />
              </svg>
              <span className={`absolute text-3xl font-bold ${getScoreLevel(data.overallScore).text}`}>
                {data.overallScore.toFixed(0)}
              </span>
            </div>
            <p className={`text-sm font-semibold ${getScoreLevel(data.overallScore).text}`}>
              {getScoreLevel(data.overallScore).label}
            </p>
          </div>

          {/* Category Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const score = data[cat.key as keyof typeof data] as number
              const level = getScoreLevel(score)
              const Icon = cat.icon
              return (
                <div key={cat.key} className={`rounded-xl border ${level.bg} bg-white p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-600">{cat.label}</span>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${level.bg}`}>
                      <Icon size={18} className={level.text} />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${level.text} mb-2`}>{score.toFixed(0)}</p>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${level.color}`} style={{ width: `${score}%` }} />
                  </div>
                  <p className={`text-xs font-medium mt-1.5 ${level.text}`}>{level.label}</p>
                </div>
              )
            })}
          </div>

          {/* Detailed Breakdown */}
          {data.items && data.items.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Score Breakdown</h3>
              <div className="space-y-4">
                {data.items.map((item, i) => {
                  const level = getScoreLevel(item.score)
                  const Icon = CATEGORY_ICONS[item.category] || BarChart3
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${level.bg} shrink-0`}>
                        <Icon size={15} className={level.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{item.category}</span>
                          <span className={`text-xs font-semibold ${level.text}`}>
                            {item.score.toFixed(0)} · {item.status}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${level.color}`} style={{ width: `${item.score}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <HeartPulse size={40} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No health data available</h3>
          <p className="text-sm text-gray-500">Connect your business data to see health scores.</p>
        </div>
      )}
    </div>
  )
}
