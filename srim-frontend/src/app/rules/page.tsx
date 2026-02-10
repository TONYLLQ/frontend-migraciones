
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Search, Filter, Code2, CheckCircle2, XCircle, Edit2, Trash2, Zap } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from '@/hooks/use-toast'
import { RuleDimension, DataQualityRule, DataQualityRuleAction, RuleActionType } from '@/types/data-quality'
import { GLOBAL_RULES_CATALOG } from '@/lib/mock-data'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Separator } from '@/components/ui/separator'

const DIMENSIONS: RuleDimension[] = ['Integrity', 'Consistency', 'Exactness', 'Uniqueness'];
const ACTION_TYPES: RuleActionType[] = ['Preventive', 'Manual', 'Massive'];

export default function RulesPage() {
  const { role, isUser, isAnalyst, isCoordinator } = useCurrentUser();
  const [rules, setRules] = useState<DataQualityRule[]>(GLOBAL_RULES_CATALOG)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<DataQualityRule | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    dimension: 'Integrity' as RuleDimension,
    sql: '',
    actions: [] as DataQualityRuleAction[]
  })

  const [newAction, setNewAction] = useState({ type: 'Manual' as RuleActionType, description: '' })

  const canEdit = isCoordinator || isAnalyst;
  const isTechnical = isCoordinator || isAnalyst;

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({ name: '', dimension: 'Integrity', sql: '', actions: [] });
    setIsDialogOpen(true);
  }

  const handleOpenEdit = (rule: DataQualityRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      dimension: rule.dimension,
      sql: rule.sqlQuery,
      actions: [...rule.actions]
    });
    setIsDialogOpen(true);
  }

  const addActionToRule = () => {
    if (!newAction.description) return;
    setFormData({
      ...formData,
      actions: [...formData.actions, { ...newAction }]
    });
    setNewAction({ type: 'Manual', description: '' });
  }

  const removeActionFromRule = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  }

  const handleSaveRule = () => {
    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Completa el nombre de la regla."
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

    if (editingRule) {
      setRules(rules.map(r => r.id === editingRule.id ? {
        ...r,
        name: formData.name,
        dimension: formData.dimension,
        sqlQuery: formData.sql,
        actions: formData.actions
      } : r));
      
      toast({
        title: "Regla Actualizada",
        description: `Se han guardado los cambios en la regla ${editingRule.id}.`
      })
    } else {
      const created: DataQualityRule = {
        id: `R-0${rules.length + 1}`,
        name: formData.name,
        dimension: formData.dimension,
        isActive: isTechnical, // Si la crea un usuario no técnico, podría nacer inactiva hasta que se le asigne SQL
        sqlQuery: formData.sql,
        actions: formData.actions
      };
      setRules([created, ...rules]);
      
      toast({
        title: "Regla Registrada",
        description: isTechnical 
          ? "La regla ha sido añadida al catálogo con su SQL." 
          : "Regra de negocio creada. Un analista completará la validación técnica SQL."
      })
    }

    setIsDialogOpen(false);
  }

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
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Dimensión</Label>
                <Select 
                  value={formData.dimension} 
                  onValueChange={(v) => setFormData({...formData, dimension: v as RuleDimension})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIMENSIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isTechnical && (
              <div className="grid gap-2">
                <Label>Consulta SQL de Validación</Label>
                <Textarea 
                  placeholder="SELECT * FROM table WHERE column IS NULL..." 
                  className="font-mono text-xs min-h-[100px]"
                  value={formData.sql}
                  onChange={(e) => setFormData({...formData, sql: e.target.value})}
                />
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <Label className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent" /> Acciones Sugeridas</Label>
              <div className="flex gap-2">
                <Select 
                  value={newAction.type} 
                  onValueChange={(v) => setNewAction({...newAction, type: v as RuleActionType})}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input 
                  placeholder="Descripción de la acción..." 
                  value={newAction.description}
                  onChange={(e) => setNewAction({...newAction, description: e.target.value})}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={addActionToRule}><Plus className="h-4 w-4" /></Button>
              </div>

              <div className="space-y-2">
                {formData.actions.map((action, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-[10px]">{action.type}</Badge>
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
            <Button onClick={handleSaveRule}>{editingRule ? 'Guardar Cambios' : 'Guardar en Catálogo'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar regla..." className="pl-10" />
        </div>
        <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> Dimensiones</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rules.map((rule) => (
          <Card key={rule.id} className="hover:border-accent transition-colors flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="text-[10px] font-mono">{rule.id}</Badge>
                {rule.isActive ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-none"><CheckCircle2 className="mr-1 h-3 w-3" /> Activa</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 border-none"><Clock className="mr-1 h-3 w-3" /> Pendiente SQL</Badge>
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
                <span className="font-semibold text-muted-foreground uppercase tracking-tight">{rule.dimension}</span>
                <div className="flex gap-1">
                  {canEdit && (
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleOpenEdit(rule)}>
                      <Edit2 className="mr-2 h-3 w-3" /> Editar
                    </Button>
                  )}
                  {isTechnical && (
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Code2 className="mr-2 h-3 w-3" /> SQL
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
