import React, { useState, useMemo } from 'react'
import { MOCK_SCENARIOS, MOCK_USERS } from '@/lib/mock-data'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Eye,
  UserCheck
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from "@/components/ui/label"
import { Link } from 'react-router-dom'
import { ScenarioStatus, ProcessType, DataQualityScenario } from '@/types/data-quality'
import { useCurrentUser } from '@/hooks/use-current-user'
import { toast } from '@/hooks/use-toast'

const STATUS_CONFIG: Record<ScenarioStatus, { label: string, color: string }> = {
  Registered: { label: 'Registrado', color: 'bg-slate-100 text-slate-800' },
  Assigned: { label: 'Asignado', color: 'bg-blue-100 text-blue-800' },
  Analysis: { label: 'Análisis', color: 'bg-indigo-100 text-indigo-800' },
  Evaluation: { label: 'Evaluación', color: 'bg-purple-100 text-purple-800' },
  Prioritization: { label: 'Priorización', color: 'bg-amber-100 text-amber-800' },
  Action: { label: 'Acción', color: 'bg-teal-100 text-teal-800' },
  Monitoring: { label: 'Monitoreo', color: 'bg-emerald-100 text-emerald-800' },
}

const PROCESS_OPTIONS: ProcessType[] = [
  'Control Migratorio',
  'Nacionalización',
  'Emisión de Documentos',
  'Inmigración'
];

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<DataQualityScenario[]>(MOCK_SCENARIOS)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMine, setFilterMine] = useState(false)
  const { user, isCoordinator } = useCurrentUser();
  
  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newScenario, setNewScenario] = useState({
    title: '',
    process: 'Control Migratorio' as ProcessType,
    analystId: ''
  })

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => {
      const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           s.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMine = filterMine ? s.analystId === user.id : true;
      
      return matchesSearch && matchesMine;
    });
  }, [searchTerm, filterMine, user.id, scenarios]);

  const handleCreateScenario = () => {
    if (!newScenario.title || !newScenario.analystId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor completa todos los campos obligatorios."
      })
      return;
    }

    const createdScenario: DataQualityScenario = {
      id: `SC-0${scenarios.length + 10}`,
      title: newScenario.title,
      process: newScenario.process,
      status: 'Registered',
      analystId: newScenario.analystId,
      createdAt: new Date().toISOString(),
      rules: [],
      actions: [],
      history: [
        { status: 'Registered', changedAt: new Date().toISOString(), changedBy: user.id }
      ],
      documents: []
    }

    setScenarios([createdScenario, ...scenarios]);
    setIsDialogOpen(false);
    setNewScenario({ title: '', process: 'Control Migratorio', analystId: '' });
    
    toast({
      title: "Escenario Creado",
      description: `El escenario ${createdScenario.id} ha sido registrado exitosamente.`
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Gestión de Escenarios</h2>
          <p className="text-muted-foreground">
            {isCoordinator 
              ? "Bandeja centralizada de gobernanza de datos." 
              : "Mis tareas de análisis y remediación."}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Escenario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Escenario</DialogTitle>
              <DialogDescription>
                Define un nuevo caso de uso para el monitoreo de calidad de datos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título del Escenario</Label>
                <Input 
                  id="title" 
                  placeholder="Ej: Validación de Correos Masivos" 
                  value={newScenario.title}
                  onChange={(e) => setNewScenario({...newScenario, title: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="process">Proceso Asociado</Label>
                <Select 
                  value={newScenario.process} 
                  onValueChange={(v) => setNewScenario({...newScenario, process: v as ProcessType})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un proceso" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCESS_OPTIONS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="analyst">Asignar Analista</Label>
                <Select 
                  value={newScenario.analystId} 
                  onValueChange={(v) => setNewScenario({...newScenario, analystId: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un analista" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_USERS.filter(u => u.role === 'Analyst').map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateScenario}>Crear Registro</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por ID o título..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {!isCoordinator && (
            <Button 
              variant={filterMine ? "default" : "outline"} 
              size="sm" 
              onClick={() => setFilterMine(!filterMine)}
              className="gap-2"
            >
              <UserCheck className="h-4 w-4" /> Mis Asignaciones
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Escenario</TableHead>
              <TableHead>Proceso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Analista</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredScenarios.length > 0 ? filteredScenarios.map((scenario) => {
              const analyst = MOCK_USERS.find(u => u.id === scenario.analystId)
              const status = STATUS_CONFIG[scenario.status]
              
              return (
                <TableRow key={scenario.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold">{scenario.id}</TableCell>
                  <TableCell>
                    <div className="font-medium text-primary">{scenario.title}</div>
                    <div className="text-xs text-muted-foreground">{scenario.rules.length} reglas asociadas</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">{scenario.process}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${status.color} border-none font-medium px-2 py-0.5`}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {analyst?.name || 'No asignado'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link to={`/scenarios/${scenario.id}`} className="flex items-center">
                            <Eye className="mr-2 h-4 w-4" /> Ver Detalle
                          </Link>
                        </DropdownMenuItem>
                        {isCoordinator && (
                          <DropdownMenuItem className="cursor-pointer">
                            Reasignar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            }) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron escenarios con los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
