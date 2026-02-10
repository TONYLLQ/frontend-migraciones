
import React, { useMemo, useState } from 'react'
import { MOCK_SCENARIOS, MOCK_USERS, GLOBAL_RULES_CATALOG } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Zap
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ScenarioStatus, DataQualityRule, ScenarioAction } from '@/types/data-quality'
import { Separator } from '@/components/ui/separator'
import { useCurrentUser } from '@/hooks/use-current-user'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from '@/hooks/use-toast'

const STEPS: ScenarioStatus[] = [
  'Registered', 
  'Assigned', 
  'Analysis', 
  'Evaluation', 
  'Prioritization', 
  'Action', 
  'Monitoring'
];

const STEP_LABELS: Record<ScenarioStatus, string> = {
  Registered: 'Registro',
  Assigned: 'Asignado',
  Analysis: 'Análisis',
  Evaluation: 'Evaluación',
  Prioritization: 'Priorización',
  Action: 'Acción',
  Monitoring: 'Monitoreo'
};

export default function ScenarioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const initialScenario = MOCK_SCENARIOS.find((s) => s.id === (id || ""));
  const [scenario, setScenario] = useState(initialScenario);
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const { user, isCoordinator, isAnalyst, isUser } = useCurrentUser();

  if (!scenario) return <div>No encontrado</div>;

  const currentStepIndex = STEPS.indexOf(scenario.status);
  const isAssignedToMe = scenario.analystId === user.id;
  const canModify = isCoordinator || (isAnalyst && isAssignedToMe);
  const isTechnical = isCoordinator || isAnalyst;

  // Group actions by ruleId for easier linkage
  const actionsByRule = useMemo(() => {
    const map: Record<string, ScenarioAction[]> = {};
    scenario.actions.forEach(action => {
      if (action.ruleId) {
        if (!map[action.ruleId]) map[action.ruleId] = [];
        map[action.ruleId].push(action);
      }
    });
    return map;
  }, [scenario.actions]);

  const handleLinkRule = (rule: DataQualityRule) => {
    if (scenario.rules.some(r => r.id === rule.id)) {
      toast({ variant: "destructive", title: "Ya vinculada", description: "Esta regla ya forma parte del escenario." });
      return;
    }

    // When linking a rule, we also suggest the actions defined in the global catalog
    const newActions: ScenarioAction[] = rule.actions.map((a, idx) => ({
      id: `a-${rule.id}-${scenario.actions.length + idx}`,
      description: a.description,
      status: 'Pending',
      responsibleId: scenario.analystId,
      ruleId: rule.id
    }));

    setScenario({
      ...scenario,
      rules: [...scenario.rules, rule],
      actions: [...scenario.actions, ...newActions]
    });
    
    setIsLinkingOpen(false);
    toast({ title: "Regla Vinculada", description: `Se ha añadido '${rule.name}' y sus acciones sugeridas.` });
  };

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
              <h2 className="text-3xl font-bold tracking-tight text-primary">{scenario.id}: {scenario.title}</h2>
              <Badge variant="outline" className="text-xs">{scenario.process}</Badge>
            </div>
            <p className="text-muted-foreground">Gestionado por {MOCK_USERS.find(u => u.id === scenario.analystId)?.name}</p>
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
                  {GLOBAL_RULES_CATALOG.map(rule => (
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
                  ))}
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
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
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
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
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

                    {/* Visual linkage of actions within the rule card */}
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
                        {isTechnical && <Button size="sm" variant="outline"><Play className="mr-2 h-3 w-3" /> Ejecutar Prueba</Button>}
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => {
                          setScenario({ 
                            ...scenario, 
                            rules: scenario.rules.filter(r => r.id !== rule.id),
                            actions: scenario.actions.filter(a => a.ruleId !== rule.id)
                          });
                          toast({ title: "Regla y acciones desvinculadas" });
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
                const associatedRule = scenario.rules.find(r => r.id === action.ruleId);
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
                            <p className="text-[10px] text-muted-foreground">Responsable: {MOCK_USERS.find(u => u.id === action.responsibleId)?.name}</p>
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
                );
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
                    <Button size="sm" variant="outline"><Upload className="mr-2 h-4 w-4" /> Subir</Button>
                  </div>
                  <div className="space-y-2">
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
                <Button className="w-full bg-accent hover:bg-accent/90">Avanzar Etapa</Button>
                {isCoordinator && <Button variant="outline" className="w-full">Reasignar Analista</Button>}
                <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10">Rechazar</Button>
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
      </div>
    </div>
  )
}
