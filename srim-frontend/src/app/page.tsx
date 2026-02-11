import React from 'react'
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

const DATA_SCENARIOS = [
  { name: 'Registrado', count: 12, fill: 'hsl(var(--muted))' },
  { name: 'Asignado', count: 8, fill: 'hsl(210, 29%, 40%)' },
  { name: 'Análisis', count: 15, fill: 'hsl(var(--primary))' },
  { name: 'Acción', count: 6, fill: 'hsl(var(--accent))' },
  { name: 'Monitoreo', count: 24, fill: '#10b981' },
]

const QUALITY_TREND = [
  { month: 'Ene', integrity: 92, uniqueness: 98, exactness: 88 },
  { month: 'Feb', integrity: 94, uniqueness: 97, exactness: 90 },
  { month: 'Mar', integrity: 95, uniqueness: 98, exactness: 92 },
]

const PIE_DATA = [
  { name: 'Integridad', value: 45, color: '#34495E' },
  { name: 'Unicidad', value: 25, color: '#008080' },
  { name: 'Consistencia', value: 20, color: '#2C3E50' },
  { name: 'Exactitud', value: 10, color: '#7F8C8D' },
]

export default function DashboardPage() {
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
          value="41"
          change="+4 desde ayer"
          icon={<FileText className="h-5 w-5" />}
        />
        <StatsCard
          title="Reglas Observadas"
          value="18"
          change="-2 este periodo"
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          trend="down"
        />
        <StatsCard
          title="Acciones Pendientes"
          value="7"
          change="3 críticas"
          icon={<Clock className="h-5 w-5 text-destructive" />}
        />
        <StatsCard
          title="Tasa de Calidad"
          value="95.4%"
          change="+1.2% global"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          trend="up"
        />
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
                <BarChart data={DATA_SCENARIOS}>
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
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {PIE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {PIE_DATA.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground">{entry.name}</span>
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-full bg-muted p-1.5">{icon}</div>
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
