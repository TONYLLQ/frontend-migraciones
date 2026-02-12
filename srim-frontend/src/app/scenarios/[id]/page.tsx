"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { scenarioService } from '@/features/scenarios/service'
import { rulesService } from '@/features/rules/service'
import { executionsService } from '@/features/executions/service'
import type { Scenario, ApiScenarioStatus, ApiScenarioTransition } from '@/features/scenarios/types'
import type { ApiQualityRule } from '@/features/rules/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle2,
  History,
  FileCode,
  ShieldAlert,
  ArrowLeft,
  Upload,
  Play,
  CheckCircle,
  Clock,
  ExternalLink,
  PlusCircle,
  Search,
  Zap,
  Loader2
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useCurrentUser } from '@/hooks/use-current-user'
import { getAnalysts, type User } from '@/services/user-service'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from '@/hooks/use-toast'
import type {
  DataQualityRule,
  DataQualityScenario,
  ScenarioAction,
  ScenarioHistory,
  ScenarioStatus,
  RuleActionType,
  RuleDimension,
} from '@/types/data-quality'

const STEPS: ScenarioStatus[] = [
  'Registered',
  'Assigned',
  'Analysis',
  'Evaluation',
  'Prioritization',
  'Action',
  'Monitoring'
]

const STEP_LABELS: Record<ScenarioStatus, string> = {
  Registered: 'Registro',
  Assigned: 'Asignado',
  Analysis: 'Análisis',
  Evaluation: 'Evaluación',
  Prioritization: 'Priorización',
  Action: 'Acción',
  Monitoring: 'Monitoreo'
}

const mapStatusCode = (code?: string): ScenarioStatus => {
  switch ((code || '').toUpperCase()) {
    case 'REGISTERED':
    case 'REGISTRADO':
      return 'Registered'
    case 'ASSIGNED':
    case 'ASIGNADO':
      return 'Assigned'
    case 'ANALYSIS':
    case 'ANALISIS':
      return 'Analysis'
    case 'EVALUATION':
    case 'EVALUACION':
      return 'Evaluation'
    case 'PRIORITIZATION':
    case 'PRIORIZACION':
      return 'Prioritization'
    case 'ACTION':
    case 'ACCION':
      return 'Action'
    case 'MONITORING':
    case 'MONITOREO':
      return 'Monitoring'
    default:
      return 'Registered'
  }
}

const mapDimension = (name?: string): RuleDimension => {
  const n = (name || '').toLowerCase()
  if (n.includes('unic') || n.includes('unique')) return 'Uniqueness'
  if (n.includes('integr')) return 'Integrity'
  if (n.includes('consist')) return 'Consistency'
  if (n.includes('exact')) return 'Exactness'
  return 'Integrity'
}

const mapActionType = (name?: string): RuleActionType => {
  const n = (name || '').toLowerCase()
  if (n.includes('prev')) return 'Preventive'
  if (n.includes('mass')) return 'Massive'
  return 'Manual'
}

const mapRule = (rule: ApiQualityRule): DataQualityRule => ({
  id: rule.id,
  name: rule.name,
  isActive: rule.is_active,
  dimension: mapDimension(rule.dimension_name || rule.dimension_code),
  sqlQuery: rule.sql_query || '',
  actions: rule.actions.map((a) => ({
    type: mapActionType(a.action_type_name || a.action_type_code),
    description: a.description,
  }))
})

  const mapScenario = (api: Scenario, rulesCatalog: ApiQualityRule[]): DataQualityScenario => {
  const rulesMap = new Map(rulesCatalog.map((r) => [r.id, r]))
  const rules: DataQualityRule[] = (api.rules || [])
    .map((id) => rulesMap.get(id))
    .filter(Boolean)
    .map((r) => mapRule(r as ApiQualityRule))

  const actions: ScenarioAction[] = (api.operational_actions || []).map((a) => ({
    id: a.id,
    description: a.description,
    status: (a.status_code || '').toUpperCase() === 'EXECUTED' ? 'Executed' : 'Pending',
    correctionQuery: a.correction_query ?? undefined,
    evidenceUrl: a.evidence_url ?? undefined,
    responsibleId: a.responsible_email ?? a.responsible ?? '',
    ruleId: a.rule ?? undefined,
  }))

  const history: ScenarioHistory[] = (api.history || []).map((h) => ({
    status: mapStatusCode(h.status_code),
    changedAt: h.changed_at,
    changedBy: h.changed_by_email ?? h.changed_by ?? '',
    comment: h.comment ?? undefined,
  }))

  return {
    id: api.id,
    title: api.title,
    process: api.process_name as DataQualityScenario['process'],
    status: mapStatusCode((api.status_code as unknown as string) || (api.status as unknown as string)),
    analystId: api.analyst ?? api.created_by ?? '',
    createdAt: api.created_at,
    rules,
    actions,
    history,
    documents: [],
  }
}

export default function ScenarioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [scenario, setScenario] = useState<DataQualityScenario | null>(null)
  const [scenarioApi, setScenarioApi] = useState<Scenario | null>(null)
  const [rulesCatalog, setRulesCatalog] = useState<ApiQualityRule[]>([])
  const [statuses, setStatuses] = useState<ApiScenarioStatus[]>([])
  const [transitions, setTransitions] = useState<ApiScenarioTransition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLinkingOpen, setIsLinkingOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [needsRuleOpen, setNeedsRuleOpen] = useState(false)
  const [cannotUnlinkOpen, setCannotUnlinkOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [analysts, setAnalysts] = useState<User[]>([])
  const [selectedAnalyst, setSelectedAnalyst] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [executingRuleId, setExecutingRuleId] = useState<string | null>(null)
  const { user, isCoordinator, isAnalyst } = useCurrentUser()

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!id) return
      setIsLoading(true)
      setError(null)
      try {
        const [scenarioApi, rulesApi, statusApi, transitionApi] = await Promise.all([
          scenarioService.getById(id),
          rulesService.getRules(),
          scenarioService.getStatuses(),
          scenarioService.getTransitions(),
        ])
        if (!active) return
        setRulesCatalog(rulesApi)
        setStatuses(statusApi)
        setTransitions(transitionApi)
        setScenarioApi(scenarioApi)
        setScenario(mapScenario(scenarioApi, rulesApi))
      } catch (err) {
        console.error(err)
        if (active) setError('No se pudo cargar el escenario.')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    let active = true
    const loadAnalysts = async () => {
      try {
        const data = await getAnalysts()
        if (!active) return
        setAnalysts(data)
      } catch (err) {
        console.error(err)
      }
    }
    loadAnalysts()
    return () => {
      active = false
    }
  }, [])

  const actionsByRule = useMemo(() => {
    const map: Record<string, ScenarioAction[]> = {}
    if (!scenario) return map
    scenario.actions.forEach(action => {
      if (action.ruleId) {
        if (!map[action.ruleId]) map[action.ruleId] = []
        map[action.ruleId].push(action)
      }
    })
    return map
  }, [scenario])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando escenario...
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-destructive">{error}</div>
        <Button asChild variant="outline">
          <Link to="/scenarios">Volver</Link>
        </Button>
      </div>
    )
  }

  if (!scenario) return <div>No encontrado</div>

  const currentStepIndex = STEPS.indexOf(scenario.status)
  const isAssignedToMe = scenario.analystId && (scenario.analystId === user?.id || scenario.analystId === user?.email)
  const canModify = isCoordinator || (isAnalyst && isAssignedToMe)
  const isTechnical = isCoordinator || isAnalyst
  const canAdvance = isAnalyst && isAssignedToMe
  const canFinalize = isAnalyst && isAssignedToMe

  const handleExecuteRule = async (ruleId: string) => {
    if (!scenarioApi) return
    setExecutingRuleId(ruleId)
    try {
      const execution = await executionsService.execute(ruleId, scenarioApi.id)
      toast({ title: 'Ejecucion iniciada', description: 'ID: ' + execution.id })
    } catch (err: any) {
      console.error(err)
      const detail = err?.response?.data?.detail
      toast({ variant: 'destructive', title: 'Error', description: detail || 'No se pudo ejecutar la regla.' })
    } finally {
      setExecutingRuleId(null)
    }
  }

  const handleLinkRule = async (rule: DataQualityRule) => {
    if (scenario.rules.some(r => r.id === rule.id)) {
      toast({ variant: "destructive", title: "Ya vinculada", description: "Esta regla ya forma parte del escenario." })
      return
    }

    if (!scenarioApi) return
    try {
      await scenarioService.createScenarioRule(scenarioApi.id, rule.id)
      const refreshed = await scenarioService.getById(scenarioApi.id)
      setScenarioApi(refreshed)
      setScenario(mapScenario(refreshed, rulesCatalog))
      setIsLinkingOpen(false)
      toast({ title: "Regla Vinculada", description: `Se ha añadido '${rule.name}'.` })
    } catch (err: any) {
      console.error(err)
      const detail = err?.response?.data?.detail
      toast({ variant: "destructive", title: "Error", description: detail || "No se pudo vincular la regla." })
    }
  }

  const resolveNextTransition = () => {
    if (!scenarioApi) return null
    const role = (user?.role || '').toUpperCase()
    const candidates = transitions.filter((t) => {
      if (!t.is_active) return false
      if (t.from_status === scenarioApi.status) return true
      const currentStatusCode = (scenarioApi.status_code as unknown as string) || (scenarioApi.status as unknown as string)
      if (currentStatusCode && t.from_status_code === currentStatusCode) return true
      return false
    })
    return candidates.find((t) => {
      if (role === 'COORDINATOR') return t.allow_coordinator
      if (role === 'ANALYST') return t.allow_analyst
      if (role === 'VIEWER') return t.allow_viewer
      return false
    }) || candidates[0] || null
  }

  const handleAdvance = async () => {
    if (scenario?.rules.length === 0) {
      setNeedsRuleOpen(true)
      return
    }
    console.log("[transition] click", new Date().toISOString())
    if (!scenarioApi) return
    const next = resolveNextTransition()
    console.log("[transition] scenario", scenarioApi)
    console.log("[transition] transitions", transitions)
    console.log("[transition] selected next", next)
    if (!next) {
      toast({ variant: "destructive", title: "Sin transición", description: "No hay una transición válida para tu rol." })
      return
    }
    setIsAdvancing(true)
    try {
      await scenarioService.transition(scenarioApi.id, next.to_status)
      const refreshed = await scenarioService.getById(scenarioApi.id)
      setScenarioApi(refreshed)
      setScenario(mapScenario(refreshed, rulesCatalog))
      toast({ title: "Etapa actualizada" })
    } catch (err: any) {
      console.error(err)
      const detail = err?.response?.data?.detail
      toast({ variant: "destructive", title: "No se pudo avanzar", description: detail || "Revisa las reglas de transición." })
    } finally {
      setIsAdvancing(false)
    }
  }

  const openAssign = () => {
    setSelectedAnalyst("")
    setIsAssignOpen(true)
  }

  const handleAssign = async () => {
    if (!scenarioApi || !selectedAnalyst) return
    setIsAssigning(true)
    try {
      await scenarioService.assignAnalyst(scenarioApi.id, selectedAnalyst)
      const refreshed = await scenarioService.getById(scenarioApi.id)
      setScenarioApi(refreshed)
      setScenario(mapScenario(refreshed, rulesCatalog))
      setIsAssignOpen(false)
    } catch (err) {
      console.error(err)
      toast({ variant: "destructive", title: "Error", description: "No se pudo reasignar." })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUpload = async () => {
    if (!scenarioApi || !uploadFile) return
    setIsUploading(true)
    try {
      await scenarioService.updateWithFile(scenarioApi.id, {}, uploadFile)
      const refreshed = await scenarioService.getById(scenarioApi.id)
      setScenarioApi(refreshed)
      setScenario(mapScenario(refreshed, rulesCatalog))
      setUploadFile(null)
      toast({ title: "Archivo actualizado" })
    } catch (err) {
      console.error(err)
      toast({ variant: "destructive", title: "Error", description: "No se pudo subir el archivo." })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/scenarios">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight text-primary">{scenario.id.slice(0, 6).toUpperCase()}: {scenario.title}</h2>
              <Badge variant="outline" className="text-xs">{scenario.process}</Badge>
            </div>
            <p className="text-muted-foreground">Gestionado por {scenario.analystId || 'Sin asignar'}</p>
          </div>
        </div>

        {canModify && (
          <Dialog open={isLinkingOpen} onOpenChange={setIsLinkingOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Vincular Regla
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Vincular Regla de Calidad</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input className="w-full pl-8 h-9 rounded-md border border-input bg-background text-sm" placeholder="Filtrar reglas..." />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {rulesCatalog.map((ruleApi) => {
                    const rule = mapRule(ruleApi)
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => handleLinkRule(rule)}
                      >
                        <div>
                          <p className="text-sm font-medium">{rule.name}</p>
                          <Badge variant="outline" className="text-[10px]">{rule.dimension}</Badge>
                          <p className="text-[10px] text-accent mt-1">{rule.actions.length} acciones sugeridas</p>
                        </div>
                        <PlusCircle className="h-4 w-4 text-accent" />
                      </div>
                    )
                  })}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="border-none shadow-sm overflow-x-auto">
        <CardContent className="py-8 min-w-[800px]">
          <div className="relative flex justify-between">
            <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 bg-muted -z-0" />
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex
              const isCurrent = index === currentStepIndex

              return (
                <div key={step} className="relative z-10 flex flex-col items-center gap-2 group">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-4 ${
                    isCompleted ? 'bg-primary border-primary text-white' :
                    isCurrent ? 'bg-background border-accent text-accent animate-pulse' :
                    'bg-background border-muted text-muted-foreground'
                  } transition-all duration-300`}>
                    {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <span className="text-sm font-bold">{index + 1}</span>}
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                    isCurrent ? 'text-accent' : isCompleted ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {STEP_LABELS[step]}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="rules" className="w-full">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="rules" className="gap-2"><ShieldAlert className="h-4 w-4" /> Reglas Aplicadas ({scenario.rules.length})</TabsTrigger>
              <TabsTrigger value="actions" className="gap-2"><Play className="h-4 w-4" /> Acciones ({scenario.actions.length})</TabsTrigger>
              <TabsTrigger value="docs" className="gap-2"><FileCode className="h-4 w-4" /> Docs</TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="mt-4 space-y-4">
              {scenario.rules.length > 0 ? scenario.rules.map(rule => (
                <Card key={rule.id} className="overflow-hidden border-l-4 border-l-accent">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{rule.name}</CardTitle>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>{rule.dimension}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isTechnical && rule.sqlQuery && (
                      <div className="rounded bg-slate-900 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
                        <code>{rule.sqlQuery}</code>
                      </div>
                    )}

                    {!rule.sqlQuery && isTechnical && (
                      <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded border border-amber-200 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Pendiente definición técnica SQL por Analista.
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Acciones Vinculadas:
                      </p>
                      {actionsByRule[rule.id]?.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {actionsByRule[rule.id].map(action => (
                            <div key={action.id} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded border">
                              <span className="flex-1">{action.description}</span>
                              <Badge variant={action.status === 'Executed' ? 'outline' : 'secondary'} className="text-[10px]">
                                {action.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] italic text-muted-foreground">Sin acciones ejecutables asociadas.</p>
                      )}
                    </div>

                    {canModify && (
                      <div className="flex gap-2 pt-2">
                        {isTechnical && (
  <Button
    size="sm"
    variant="outline"
    onClick={() => handleExecuteRule(rule.id)}
    disabled={executingRuleId === rule.id}
  >
    <Play className="mr-2 h-3 w-3" />
    {executingRuleId === rule.id ? 'Ejecutando...' : 'Ejecutar Prueba'}
  </Button>
)}
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={async () => {
                          if (scenario.rules.length <= 1) {
                            setCannotUnlinkOpen(true)
                            return
                          }
                          try {
                            await scenarioService.unlinkScenarioRule(scenarioApi?.id || '', rule.id)
                            const refreshed = await scenarioService.getById(scenarioApi?.id || '')
                            setScenarioApi(refreshed)
                            setScenario(mapScenario(refreshed, rulesCatalog))
                            toast({ title: "Regla y acciones desvinculadas" })
                          } catch (err) {
                            console.error(err)
                            toast({ variant: "destructive", title: "Error", description: "No se pudo desvincular." })
                          }
                        }}>Desvincular</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )) : (
                <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  <p>No hay reglas vinculadas.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="actions" className="mt-4 space-y-4">
              {scenario.actions.length > 0 ? scenario.actions.map(action => {
                const associatedRule = scenario.rules.find(r => r.id === action.ruleId)
                return (
                  <Card key={action.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 h-5 w-5 rounded-full ${action.status === 'Executed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {action.status === 'Executed' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{action.description}</p>
                          <div className="flex gap-2 items-center mt-1">
                            {associatedRule && (
                              <Badge variant="outline" className="text-[9px] bg-accent/5">
                                Originado por: {associatedRule.name}
                              </Badge>
                            )}
                            <p className="text-[10px] text-muted-foreground">Responsable: {action.responsibleId || 'Sin asignar'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant={action.status === 'Executed' ? 'outline' : 'default'} disabled={!canModify && action.status === 'Pending'}>
                          {action.status === 'Executed' ? 'Ver Evidencia' : 'Completar Acción'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              }) : (
                <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  <p>Sin acciones registradas.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="docs" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Archivos Adjuntos</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                        className="text-sm"
                      />
                      <Button size="sm" variant="outline" onClick={handleUpload} disabled={!uploadFile || isUploading}>
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploading ? "Subiendo..." : "Subir"}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {scenarioApi?.archive ? (
                      <div className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-blue-500" />
                          <span>Archivo actual</span>
                          {scenarioApi.archive_uploaded_at && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(scenarioApi.archive_uploaded_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                          <a href={scenarioApi.archive} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Sin archivo adjunto.</div>
                    )}
                    {scenario.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-blue-500" />
                          <span>{doc.name}</span>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          {canModify && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Flujo de Trabajo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={handleAdvance}
                  disabled={isAdvancing || !canAdvance}
                >
                  {isAdvancing ? "Avanzando..." : "Avanzar Etapa"}
                </Button>
                {isCoordinator && <Button variant="outline" className="w-full" onClick={openAssign}>Reasignar Analista</Button>}
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10"
                  disabled={!canFinalize}
                >
                  Finalizar Flujo
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4" /> Trazabilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scenario.history.slice().reverse().map((h, i) => (
                  <div key={i} className="relative pl-4 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-primary">
                    <div className="text-xs font-bold text-primary">{STEP_LABELS[h.status]}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(h.changedAt).toLocaleString()}</div>
                    <div className="text-[11px] mt-1 italic">"{h.comment || 'Sin comentarios'}"</div>
                    {i < scenario.history.length - 1 && <Separator className="mt-2" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={needsRuleOpen} onOpenChange={setNeedsRuleOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Necesita una regla</AlertDialogTitle>
              <AlertDialogDescription>
                Para avanzar de etapa, el escenario debe tener al menos una regla asociada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogAction onClick={() => setNeedsRuleOpen(false)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={cannotUnlinkOpen} onOpenChange={setCannotUnlinkOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Debe quedar una regla</AlertDialogTitle>
              <AlertDialogDescription>
                No puedes desvincular la última regla. Agrega otra regla antes de continuar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogAction onClick={() => setCannotUnlinkOpen(false)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reasignar Analista</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {scenario?.title}
              </div>
              <Select value={selectedAnalyst} onValueChange={setSelectedAnalyst}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un analista" />
                </SelectTrigger>
                <SelectContent>
                  {analysts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.first_name || a.last_name ? `${a.first_name} ${a.last_name}`.trim() : a.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancelar</Button>
                <Button onClick={handleAssign} disabled={!selectedAnalyst || isAssigning}>
                  {isAssigning ? "Asignando..." : "Asignar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}







