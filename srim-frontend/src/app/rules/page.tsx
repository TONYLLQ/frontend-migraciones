import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Search, Filter, Code2, CheckCircle2, Edit2, Trash2, Zap, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Separator } from '@/components/ui/separator'
import { rulesService } from '@/features/rules/service'
import type { ApiQualityRule, ApiActionType, ApiRuleDimension } from '@/features/rules/types'
import type { Scenario } from '@/features/scenarios/types'
import { scenarioService } from '@/features/scenarios/service'

type FormRuleAction = {
  id?: number;
  actionTypeId: number;
  actionTypeName: string;
  description: string;
};

export default function RulesPage() {
  const { isAnalyst, isCoordinator } = useCurrentUser();
  const [rules, setRules] = useState<ApiQualityRule[]>([])
  const [dimensions, setDimensions] = useState<ApiRuleDimension[]>([])
  const [actionTypes, setActionTypes] = useState<ApiActionType[]>([])
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ApiQualityRule | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const canSave = dimensions.length > 0 && actionTypes.length > 0

  const [formData, setFormData] = useState({
    name: '',
    dimensionId: 0,
    sql: '',
    isActive: true,
    actions: [] as FormRuleAction[],
    scenarioId: ''
  })

  const [newAction, setNewAction] = useState<FormRuleAction>({
    actionTypeId: 0,
    actionTypeName: '',
    description: '',
  })

  const [viewingSqlRule, setViewingSqlRule] = useState<ApiQualityRule | null>(null)
  const [isSqlDialogOpen, setIsSqlDialogOpen] = useState(false)

  const [selectedDimensionFilter, setSelectedDimensionFilter] = useState<number | 'all'>('all')

  const canEdit = isCoordinator || isAnalyst;
  const isTechnical = isCoordinator || isAnalyst;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [rulesData, dims, actions, scenariosData] = await Promise.all([
          rulesService.getRules(),
          rulesService.getDimensions(),
          rulesService.getActionTypes(),
          scenarioService.getAll(),
        ]);
        if (!active) return;
        setRules(rulesData);
        setDimensions(dims);
        setActionTypes(actions);
        setScenarios(scenariosData);
        setFormData((prev) => ({
          ...prev,
          dimensionId: dims[0]?.id ?? 0,
        }));
        setNewAction((prev) => ({
          ...prev,
          actionTypeId: actions[0]?.id ?? 0,
          actionTypeName: actions[0]?.name ?? '',
        }));
      } catch (err) {
        console.error(err);
        if (active) setLoadError("No se pudo cargar el catálogo de reglas.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      dimensionId: dimensions[0]?.id ?? 0,
      sql: '',
      isActive: true,
      actions: [],
      scenarioId: '',
    });
    const defaultType = actionTypes[0];
    setNewAction({
      actionTypeId: defaultType?.id ?? 0,
      actionTypeName: defaultType?.name ?? '',
      description: '',
    });
    setIsDialogOpen(true);
  }

  const handleOpenEdit = (rule: ApiQualityRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      dimensionId: rule.dimension,
      sql: rule.sql_query ?? '',
      isActive: rule.is_active,
      actions: rule.actions.map((a) => ({
        id: a.id,
        actionTypeId: a.action_type,
        actionTypeName: a.action_type_name,
        description: a.description,
      })),
      scenarioId: '',
    });
    setIsDialogOpen(true);
  }

  const addActionToRule = () => {
    if (!newAction.description || !newAction.actionTypeId) return;
    setFormData({
      ...formData,
      actions: [...formData.actions, { ...newAction }]
    });
    const defaultType = actionTypes[0];
    setNewAction({
      actionTypeId: defaultType?.id ?? 0,
      actionTypeName: defaultType?.name ?? '',
      description: '',
    });
  }

  const removeActionFromRule = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  }

  const handleViewSql = (rule: ApiQualityRule) => {
    setViewingSqlRule(rule);
    setIsSqlDialogOpen(true);
  }

  const handleSaveRule = async () => {
    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Completa el nombre de la regla."
      })
      return;
    }

    if (!formData.dimensionId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona una dimensión."
      })
      return;
    }

    if (isTechnical && !formData.sql) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Como perfil técnico, debes incluir la consulta SQL de validación."
      })
      return;
    }

    try {
      if (editingRule) {
        await rulesService.updateRule(editingRule.id, {
          name: formData.name,
          dimension: formData.dimensionId,
          is_active: formData.isActive,
          sql_query: formData.sql || null,
        });

        const currentIds = new Set(formData.actions.filter((a) => a.id).map((a) => a.id as number));
        const toDelete = editingRule.actions.filter((a) => !currentIds.has(a.id));
        const toCreate = formData.actions.filter((a) => !a.id);

        await Promise.all([
          ...toDelete.map((a) => rulesService.deleteRuleAction(a.id)),
          ...toCreate.map((a) =>
            rulesService.createRuleAction({
              rule: editingRule.id,
              action_type: a.actionTypeId,
              description: a.description,
            })
          ),
        ]);

        toast({
          title: "Regla Actualizada",
          description: `Se han guardado los cambios en la regla ${editingRule.id}.`
        });
      } else {
        const created = await rulesService.createRule({
          name: formData.name,
          dimension: formData.dimensionId,
          is_active: formData.isActive,
          sql_query: formData.sql || null,
        });

        if (formData.actions.length > 0) {
          await Promise.all(
            formData.actions.map((a) =>
              rulesService.createRuleAction({
                rule: created.id,
                action_type: a.actionTypeId,
                description: a.description,
              })
            )
          );
        }

        if (formData.scenarioId) {
          await scenarioService.createScenarioRule(formData.scenarioId, created.id);
        }

        toast({
          title: "Regla Registrada",
          description: isTechnical
            ? "La regla ha sido añadida al catálogo con su SQL."
            : "Regla de negocio creada. Un analista completará la validación técnica SQL."
        });
      }

      const updatedRules = await rulesService.getRules();
      setRules(updatedRules);
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      const axiosErr = err as any;
      const detail = axiosErr?.response?.data?.detail;
      const message = axiosErr?.response?.data?.message;
      toast({
        variant: "destructive",
        title: "Error",
        description: detail || message || "No se pudo guardar la regla. Intenta nuevamente."
      });
    }
  }

  const filteredRules = useMemo(() => {
    let result = rules;

    if (selectedDimensionFilter !== 'all') {
      result = result.filter(r => r.dimension === selectedDimensionFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((r) =>
        r.name.toLowerCase().includes(term) ||
        r.dimension_name.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term)
      );
    }

    return result;
  }, [rules, searchTerm, selectedDimensionFilter]);

  const resolveActionTypeName = (id: number) =>
    actionTypes.find((a) => a.id === id)?.name || "";

  const getRuleLabel = (rule: ApiQualityRule, index: number) =>
    `R-${String(index + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Catálogo de Reglas</h2>
          <p className="text-muted-foreground">Definiciones de calidad y acciones remediadoras vinculadas.</p>
        </div>

        <Button className="bg-accent hover:bg-accent/90" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Regla
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Editar Regla' : 'Nueva Regla de Calidad'}</DialogTitle>
            <DialogDescription>
              {isTechnical
                ? 'Define los criterios de negocio y la validación técnica SQL.'
                : 'Describe la regla de negocio que deseas monitorear.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nombre de la Regla</Label>
                <Input
                  placeholder="Ej: Validación DNI"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Dimensión</Label>
                <Select
                  value={String(formData.dimensionId)}
                  onValueChange={(v) => setFormData({ ...formData, dimensionId: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dimensions.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Asociar a Escenario (opcional)</Label>
              <Select
                value={formData.scenarioId || undefined}
                onValueChange={(v) => setFormData({ ...formData, scenarioId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un escenario" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isTechnical && (
              <div className="grid gap-2">
                <Label>Consulta SQL de Validación</Label>
                <Textarea
                  placeholder="SELECT * FROM table WHERE column IS NULL..."
                  className="font-mono text-xs min-h-[100px]"
                  value={formData.sql}
                  onChange={(e) => setFormData({ ...formData, sql: e.target.value })}
                />
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <Label className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent" /> Acciones Sugeridas</Label>
              <div className="flex gap-2">
                <Select
                  value={String(newAction.actionTypeId)}
                  onValueChange={(v) => {
                    const id = Number(v);
                    setNewAction({
                      ...newAction,
                      actionTypeId: id,
                      actionTypeName: resolveActionTypeName(id),
                    });
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Descripción de la acción..."
                  value={newAction.description}
                  onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={addActionToRule}><Plus className="h-4 w-4" /></Button>
              </div>

              <div className="space-y-2">
                {formData.actions.map((action, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-[10px]">{action.actionTypeName}</Badge>
                      <span className="text-sm">{action.description}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeActionFromRule(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveRule} disabled={!canSave}>
              Guardar en Catálogo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSqlDialogOpen} onOpenChange={setIsSqlDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Consulta SQL de Validación</DialogTitle>
            <DialogDescription>
              Regla: {viewingSqlRule?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>SQL Query</Label>
              <div className="rounded-md bg-muted p-4 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                {viewingSqlRule?.sql_query || "-- No hay consulta SQL definida --"}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSqlDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar regla..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={selectedDimensionFilter !== 'all' ? "bg-accent text-accent-foreground border-accent" : ""}>
              <Filter className="mr-2 h-4 w-4" />
              {selectedDimensionFilter === 'all'
                ? "Dimensiones"
                : dimensions.find(d => d.id === selectedDimensionFilter)?.name || "Dimensiones"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filtrar por Dimensión</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={String(selectedDimensionFilter)} onValueChange={(v) => setSelectedDimensionFilter(v === 'all' ? 'all' : Number(v))}>
              <DropdownMenuRadioItem value="all">Todas</DropdownMenuRadioItem>
              {dimensions.map((dim) => (
                <DropdownMenuRadioItem key={dim.id} value={String(dim.id)}>
                  {dim.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando reglas...
        </div>
      )}
      {loadError && (
        <div className="text-destructive text-sm">{loadError}</div>
      )}

      {!isLoading && !loadError && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRules.map((rule, index) => (
            <Card key={rule.id} className="hover:border-accent transition-colors flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="text-[10px] font-mono">{getRuleLabel(rule, index)}</Badge>
                  {rule.is_active ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-none"><CheckCircle2 className="mr-1 h-3 w-3" /> Activa</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 border-none">Inactiva</Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{rule.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Acciones ({rule.actions.length}):</p>
                  {rule.actions.map((a, i) => (
                    <div key={i} className="text-[11px] flex items-center gap-1">
                      <Zap className="h-2 w-2 text-accent" /> {a.description}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs mt-auto pt-4">
                  <span className="font-semibold text-muted-foreground uppercase tracking-tight">{rule.dimension_name}</span>
                  <div className="flex gap-1">
                    {canEdit && (
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleOpenEdit(rule)}>
                        <Edit2 className="mr-2 h-3 w-3" /> Editar
                      </Button>
                    )}
                    {isTechnical && (
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleViewSql(rule)}>
                        <Code2 className="mr-2 h-3 w-3" /> SQL
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
