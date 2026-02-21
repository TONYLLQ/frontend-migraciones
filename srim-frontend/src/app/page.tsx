import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileText
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { scenarioService } from '@/features/scenarios/service'
import { executionsService } from '@/features/executions/service'
import { SCENARIO_STATUS_LABELS, type Scenario, type ScenarioStatusCode } from '@/features/scenarios/types'

const STATUS_COLORS: Record<ScenarioStatusCode, string> = {
  REGISTRADO: 'hsl(var(--muted))',
  ASIGNADO: 'hsl(210, 29%, 40%)',
  ANALISIS: 'hsl(var(--primary))',
  EVALUACION: '#94a3b8',
  VALIDACION: '#64748b',
  ACCION: 'hsl(var(--accent))',
  MONITOREO: '#10b981',
}

const QUALITY_TREND = [
  { month: 'Ene', integrity: 92, uniqueness: 98, exactness: 88 },
  { month: 'Feb', integrity: 94, uniqueness: 97, exactness: 90 },
  { month: 'Mar', integrity: 95, uniqueness: 98, exactness: 92 },
]

const DIMENSION_COLORS = ['#34495E', '#008080', '#2C3E50', '#7F8C8D', '#0F766E', '#1F2937']
const STATUS_CODE_MAP: Record<string, ScenarioStatusCode> = {
  REGISTERED: 'REGISTRADO',
  ASSIGNED: 'ASIGNADO',
  ANALYSIS: 'ANALISIS',
  EVALUATION: 'EVALUACION',
  VALIDATION: 'VALIDACION',
  ACTION: 'ACCION',
  MONITORING: 'MONITOREO',
  REGISTRADO: 'REGISTRADO',
  ASIGNADO: 'ASIGNADO',
  ANALISIS: 'ANALISIS',
  EVALUACION: 'EVALUACION',
  VALIDACION: 'VALIDACION',
  ACCION: 'ACCION',
  MONITOREO: 'MONITOREO',
}

export default function DashboardPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [observedRulesCount, setObservedRulesCount] = useState<number | null>(null)
  const [observedRulesSum, setObservedRulesSum] = useState<number | null>(null)
  const [qualityRate, setQualityRate] = useState<number | null>(null)
  const [observedDimensions, setObservedDimensions] = useState<
    { name: string; code: string; count: number }[]
  >([])
  const [assignedStatusCounts, setAssignedStatusCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    let active = true
    const load = async () => {
      setIsLoading(true)
      try {
        const [scenarioData, observed, dimensions, assignedStatus, quality] = await Promise.all([
          scenarioService.getAll(),
          executionsService.getObservedRulesCount(),
          executionsService.getObservedRulesByDimension(),
          scenarioService.getAssignedStatusDistribution(),
          executionsService.getQualityRate(),
        ])
        if (active) {
          setScenarios(scenarioData)
          setObservedRulesCount(observed.count)
          setObservedRulesSum(observed.total_rows)
          setQualityRate(quality.rate)
          setObservedDimensions(
            (dimensions || []).map((d) => ({
              name: d.dimension__name,
              code: d.dimension__code,
              count: d.count,
            }))
          )
          setAssignedStatusCounts(
            (assignedStatus || []).reduce((acc, item) => {
              const normalized = STATUS_CODE_MAP[item.status__code] ?? item.status__code
              acc[normalized] = item.count
              return acc
            }, {} as Record<string, number>)
          )
        }
      } catch {
        if (active) {
          setScenarios([])
          setObservedRulesCount(0)
          setObservedRulesSum(0)
          setQualityRate(0)
          setObservedDimensions([])
          setAssignedStatusCounts({})
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const scenarioChartData = useMemo(() => {
    return (Object.keys(SCENARIO_STATUS_LABELS) as ScenarioStatusCode[]).map((code) => ({
      name: SCENARIO_STATUS_LABELS[code],
      count: assignedStatusCounts[code] ?? 0,
      fill: STATUS_COLORS[code],
    }))
  }, [assignedStatusCounts])

  const pieData = useMemo(() => {
    if (!observedDimensions.length) return []
    return observedDimensions.map((d, index) => ({
      name: d.name,
      value: d.count,
      color: DIMENSION_COLORS[index % DIMENSION_COLORS.length],
    }))
  }, [observedDimensions])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard de Calidad</h2>
          <p className="text-muted-foreground">Monitoreo en tiempo real de escenarios y reglas de gobernanza.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-white px-3 py-1">
            Última actualización: Hoy, 09:45 AM
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Escenarios Activos"
          value={isLoading ? "..." : String(scenarios.length)}
          change={isLoading ? "Cargando..." : "Total registrados"}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatsCard
          title="Reglas Observadas"
          value={isLoading ? "..." : String(observedRulesCount ?? 0)}
          change={`Total de registros observados: ${isLoading ? "..." : String(observedRulesSum ?? 0)}`}
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          trend="down"
        />
        <StatsCard
          title="Acciones Pendientes"
          value="7"
          change="3 críticas"
          icon={<Clock className="h-5 w-5 text-destructive" />}
        />
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Calidad</CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Mejora</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>
            <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-emerald-700">
                    {isLoading ? "..." : `${(qualityRate ?? 0).toFixed(2)}%`}
                  </span>
                  <span className="text-xs text-muted-foreground">Calculo global</span>
                </div>
                <div className="h-1.5 w-40 rounded-full bg-emerald-100">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, qualityRate ?? 0))}%` }}
                  />
                </div>
              </div>
              <div className="relative">
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-red-600">Brecha</div>
                  <div className="text-lg font-bold text-red-700">
                    {isLoading ? "..." : `${(100 - (qualityRate ?? 0)).toFixed(2)}%`}
                  </div>
                </div>
                <div className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-red-500/20" />
                <div className="absolute -left-2 -bottom-2 h-3 w-3 rounded-full bg-red-500/10" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-md min-w-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Distribución de Escenarios por Estado
            </CardTitle>
            <CardDescription>Carga de trabajo actual por etapa del ciclo de vida.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-md min-w-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Dimensiones de Calidad
            </CardTitle>
            <CardDescription>Principales focos de reglas activas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="whitespace-nowrap text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatsCard({ title, value, change, icon, trend = 'neutral' }: {
  title: string,
  value: string,
  change: string,
  icon: React.ReactNode,
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="mt-2 flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${
              trend === 'up' ? 'bg-emerald-500' :
              trend === 'down' ? 'bg-amber-500' :
              'bg-slate-300'
            }`} />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {trend === 'up' ? 'Mejora' : trend === 'down' ? 'Alerta' : 'Estable'}
            </span>
          </div>
        </div>
        <div className={`rounded-full p-2 shadow-inner ${
          trend === 'up' ? 'bg-emerald-50 text-emerald-600' :
          trend === 'down' ? 'bg-amber-50 text-amber-600' :
          'bg-slate-100 text-slate-600'
        }`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">{value}</div>
        <p className={`text-xs mt-1 ${trend === 'up' ? 'text-emerald-600' :
            trend === 'down' ? 'text-amber-600' :
              'text-muted-foreground'
          }`}>
          {change}
        </p>
      </CardContent>
    </Card>
  )
}


