import { useEffect, useMemo, useState } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Plus, Search, Filter, Loader2, Save, MoreVertical, Eye, UserCog, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useForm } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
import { scenarioService } from "@/features/scenarios/service"
import { type CreateScenarioDTO, type ApiScenarioProcess, type ApiScenarioStatus, type Scenario } from "@/features/scenarios/types"
import { getAnalysts, type User } from "@/services/user-service"

export default function ScenariosPage() {
    const { user, isCoordinator, isAnalyst, isLoading } = useCurrentUser();
    const canCreateScenario = isCoordinator || isAnalyst
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)
    const [createFile, setCreateFile] = useState<File | null>(null)
    const [scenarios, setScenarios] = useState<Scenario[]>([])
    const [isListLoading, setIsListLoading] = useState(false)
    const [listError, setListError] = useState<string | null>(null)
    const [isAssignOpen, setIsAssignOpen] = useState(false)
    const [assignScenario, setAssignScenario] = useState<Scenario | null>(null)
    const [analysts, setAnalysts] = useState<User[]>([])
    const [selectedAnalyst, setSelectedAnalyst] = useState("")
    const [isAssigning, setIsAssigning] = useState(false)
    const [needsRuleOpen, setNeedsRuleOpen] = useState(false)
    const [processes, setProcesses] = useState<ApiScenarioProcess[]>([])
    const [statuses, setStatuses] = useState<ApiScenarioStatus[]>([])
    const [catalogError, setCatalogError] = useState<string | null>(null)
    const [isCatalogLoading, setIsCatalogLoading] = useState(false)

    const [filterProcess, setFilterProcess] = useState<string>("all")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<CreateScenarioDTO>()

    const registeredStatusId = useMemo(() => {
        const found = statuses.find((s) => s.code === "REGISTRADO" || s.code === "REGISTERED");
        return found?.id ?? 0;
    }, [statuses]);

    useEffect(() => {
        if (registeredStatusId) {
            setValue("status", registeredStatusId, { shouldValidate: true });
        }
    }, [registeredStatusId, setValue]);

    useEffect(() => {
        let active = true;
        const loadCatalogs = async () => {
            setIsCatalogLoading(true);
            setCatalogError(null);
            try {
                const [procData, statusData] = await Promise.all([
                    scenarioService.getProcesses(),
                    scenarioService.getStatuses(),
                ]);
                if (!active) return;
                setProcesses(procData);
                setStatuses(statusData);
            } catch (err) {
                console.error(err);
                if (active) setCatalogError("No se pudo cargar el catálogo de procesos/estados.");
            } finally {
                if (active) setIsCatalogLoading(false);
            }
        };
        loadCatalogs();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        const loadScenarios = async () => {
            setIsListLoading(true);
            setListError(null);
            try {
                const data = await scenarioService.getAll();
                if (!active) return;
                setScenarios(data);
            } catch (err) {
                console.error(err);
                if (active) setListError("No se pudo cargar la lista de escenarios.");
            } finally {
                if (active) setIsListLoading(false);
            }
        };
        loadScenarios();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        const loadAnalysts = async () => {
            try {
                const data = await getAnalysts();
                if (!active) return;
                setAnalysts(data);
            } catch (err) {
                console.error(err);
            }
        };
        loadAnalysts();
        return () => {
            active = false;
        };
    }, []);

    const filteredScenarios = useMemo(() => {
        return scenarios.filter((s) => {
            const matchesSearch = searchTerm === "" ||
                s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.id.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesProcess = filterProcess === "all" || s.process === Number(filterProcess);
            const matchesStatus = filterStatus === "all" || s.status === Number(filterStatus);

            return matchesSearch && matchesProcess && matchesStatus;
        });
    }, [scenarios, searchTerm, filterProcess, filterStatus]);

    const openAssign = (scenario: Scenario) => {
        if (!scenario.rules_count || scenario.rules_count === 0) {
            setNeedsRuleOpen(true);
            return;
        }
        setAssignScenario(scenario);
        setSelectedAnalyst("");
        setIsAssignOpen(true);
    };

    const handleAssign = async () => {
        if (!assignScenario || !selectedAnalyst) return;
        setIsAssigning(true);
        try {
            await scenarioService.assignAnalyst(assignScenario.id, selectedAnalyst);
            const updated = await scenarioService.getAll();
            setScenarios(updated);
            setIsAssignOpen(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsAssigning(false);
        }
    };

    const onCreate = async (data: CreateScenarioDTO) => {
        setIsSaving(true)
        setCreateError(null)
        try {
            let finalStatus = data.status;
            if (!finalStatus && registeredStatusId) {
                finalStatus = registeredStatusId;
            }

            let proc = processes.find(p => String(p.id) === String(data.process));
            if (!proc) {
                proc = processes.find(p => p.code === String(data.process));
            }

            let stat = statuses.find(s => String(s.id) === String(finalStatus));
            if (!stat) {
                stat = statuses.find(s => s.code === String(finalStatus));
            }

            if (!proc) {
                console.error("Process not found in catalog for ID:", data.process);
                throw { response: { data: "Error interno: Proceso no encontrado en catálogo." } };
            }
            if (!stat && !finalStatus) {
                console.error("Status not found and no final status:", finalStatus);
                throw { response: { data: "Error interno: Estado inicial no determinado." } };
            }

            if (finalStatus === 0 && !stat) {
                throw { response: { data: "El estado inicial 'REGISTRADO' no existe en el catálogo cargado." } };
            }

            const payload: CreateScenarioDTO = {
                ...data,
                process: proc.code,
                status: stat?.code || "REGISTERED"
            };

            await scenarioService.createWithFile(payload, createFile)
            const updated = await scenarioService.getAll()
            setScenarios(updated)
            reset()
            setCreateFile(null)
            setIsCreateOpen(false)
        } catch (err: any) {
            console.error(err)
            const detail = err?.response?.data;
            let msg = "Error al crear el escenario.";

            if (detail) {
                if (typeof detail === "string") {
                    msg = detail;
                } else if (Array.isArray(detail) && detail.length > 0) {
                    msg = detail[0];
                } else if (typeof detail === "object") {
                    // Extract first error message from object if possible, or stringify
                    const keys = Object.keys(detail);
                    if (keys.length > 0) {
                        const firstKey = keys[0];
                        const firstError = detail[firstKey];
                        if (Array.isArray(firstError)) {
                            msg = `${firstKey}: ${firstError[0]}`;
                        } else {
                            msg = `${firstKey}: ${String(firstError)}`;
                        }
                    }
                }
            }
            setCreateError(msg)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="text-muted-foreground">Cargando perfil...</div>
            </div>
        )
    }

    // Fallback if user is somehow null but not loading (shouldn't happen due to PrivateRoute, but safe to check)
    if (!user) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Gestión de Escenarios</h2>
                    <p className="text-muted-foreground">Bandeja centralizada de gobernanza de datos.</p>
                </div>
                {canCreateScenario && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-teal-700 text-white shadow-lg hover:bg-teal-800">
                                <Plus className="h-4 w-4" /> Nuevo Escenario
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Nuevo Escenario</DialogTitle>
                                <DialogDescription>
                                    Registre un nuevo requerimiento de calidad de datos.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit(onCreate)} className="space-y-5">
                                {createError && (
                                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                        {createError}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="title">Título del Escenario</Label>
                                    <Input
                                        id="title"
                                        placeholder="Ej. Validación de Pasaportes Extranjeros"
                                        {...register("title", { required: "El título es obligatorio" })}
                                    />
                                    {errors.title && <span className="text-destructive text-xs">{errors.title.message}</span>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="process">Proceso de Negocio</Label>
                                    <input type="hidden" {...register("process", { required: "El proceso es obligatorio" })} />
                                    <Select onValueChange={(val) => setValue("process", val, { shouldValidate: true })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione un proceso" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {processes.map((p) => (
                                                <SelectItem key={p.id} value={String(p.code)}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.process && <span className="text-destructive text-xs">{errors.process.message}</span>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describa el objetivo y alcance de este escenario de calidad..."
                                        className="min-h-[120px]"
                                        {...register("description")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="archive" className="flex items-center gap-2">
                                        <Upload className="h-4 w-4 text-muted-foreground" />
                                        Archivo (opcional)
                                    </Label>
                                    <Input
                                        id="archive"
                                        type="file"
                                        onChange={(e) => setCreateFile(e.target.files?.[0] ?? null)}
                                    />
                                </div>

                                <input type="hidden" {...register("status", { required: "El estado es obligatorio" })} />
                                {catalogError && (
                                    <div className="text-destructive text-xs">{catalogError}</div>
                                )}

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSaving || isCatalogLoading || !registeredStatusId}
                                        className="gap-2"
                                        onClick={() => {
                                            if (registeredStatusId) {
                                                setValue("status", registeredStatusId, { shouldValidate: true });
                                            }
                                        }}
                                    >
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Guardar Escenario
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por ID o título..."
                        className="pl-9 bg-white shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 bg-white shadow-sm">
                            <Filter className="h-4 w-4" /> Filtros
                            {(filterProcess !== "all" || filterStatus !== "all") && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                    {(filterProcess !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0)}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Filtrar por Proceso</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={filterProcess} onValueChange={setFilterProcess}>
                            <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                            {processes.map((p) => (
                                <DropdownMenuRadioItem key={p.id} value={String(p.id)}>
                                    {p.name}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={filterStatus} onValueChange={setFilterStatus}>
                            <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                            {statuses.map((s) => (
                                <DropdownMenuRadioItem key={s.id} value={String(s.id)}>
                                    {s.name}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Card className="border-none shadow-md">
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Escenario</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Proceso</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Analista</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {isListLoading && (
                                    <tr>
                                        <td colSpan={6} className="h-24 text-center text-muted-foreground">
                                            Cargando escenarios...
                                        </td>
                                    </tr>
                                )}
                                {!isListLoading && listError && (
                                    <tr>
                                        <td colSpan={6} className="h-24 text-center text-destructive">
                                            {listError}
                                        </td>
                                    </tr>
                                )}
                                {!isListLoading && !listError && filteredScenarios.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No se encontraron escenarios con los filtros actuales.
                                        </td>
                                    </tr>
                                )}
                                {!isListLoading && !listError && filteredScenarios.map((s, index) => (
                                    <tr key={s.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                                            {`SC-${String(index + 1).padStart(3, "0")}`}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-medium text-primary">{s.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {(s.rules_count ?? 0)} reglas asociadas
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge variant="secondary" className="rounded-full bg-muted/60 text-foreground border border-muted">
                                                {s.process_name}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge className="rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                                                {s.status_name}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4">{s.analyst_name || s.analyst_email || "-"}</td>
                                        <td className="px-4 py-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-full border-muted bg-white shadow-sm hover:bg-muted/50"
                                                    >
                                                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="min-w-44 rounded-lg border shadow-md">
                                                    <DropdownMenuItem asChild>
                                                        <Link to={`/scenarios/${s.id}`} className="flex items-center gap-2">
                                                            <Eye className="h-4 w-4" /> Ver Detalle
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="flex items-center gap-2"
                                                        onClick={() => openAssign(s)}
                                                        disabled={Boolean(s.analyst)}
                                                    >
                                                        <UserCog className="h-4 w-4" />
                                                        {s.analyst ? "Asignado" : "Asignar"}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Asignar Analista</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            {assignScenario?.title}
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

            <AlertDialog open={needsRuleOpen} onOpenChange={setNeedsRuleOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Necesita una regla</AlertDialogTitle>
                        <AlertDialogDescription>
                            Para asignar un analista, el escenario debe tener al menos una regla asociada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogAction onClick={() => setNeedsRuleOpen(false)}>
                        Entendido
                    </AlertDialogAction>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
