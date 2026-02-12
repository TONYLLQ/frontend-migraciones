"use client"

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { ArrowLeft, Loader2, Save, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type CreateScenarioDTO, type ApiScenarioProcess, type ApiScenarioStatus } from "@/features/scenarios/types"
import { scenarioService } from "@/features/scenarios/service"
import { useCurrentUser } from "@/hooks/use-current-user"

export default function NewScenarioPage() {
    const navigate = useNavigate()
    const { isCoordinator, isAnalyst } = useCurrentUser()
    const [processes, setProcesses] = useState<ApiScenarioProcess[]>([])
    const [statuses, setStatuses] = useState<ApiScenarioStatus[]>([])
    const [catalogError, setCatalogError] = useState<string | null>(null)
    const [isCatalogLoading, setIsCatalogLoading] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateScenarioDTO>()

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

    const onSubmit = async (data: CreateScenarioDTO) => {
        setIsLoading(true)
        setError(null)
        try {
            if (!data.status && registeredStatusId) {
                data.status = registeredStatusId;
            }
            await scenarioService.createWithFile(data, file)
            navigate("/scenarios")
        } catch (err) {
            console.error(err);
            setError("Error al crear el escenario. Por favor intente nuevamente.")
        } finally {
            setIsLoading(false)
        }
    }

    // Security check (UI level)
    if (!isCoordinator && !isAnalyst) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-semibold text-destructive">Acceso Denegado</h2>
                <p>Solo coordinadores y analistas pueden crear escenarios.</p>
                <Button onClick={() => navigate("/scenarios")}>Volver</Button>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/scenarios")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Nuevo Escenario</h2>
                    <p className="text-muted-foreground">Registre un nuevo requerimiento de calidad de datos.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalles Generales</CardTitle>
                    <CardDescription>
                        Complete la información básica del escenario.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {error}
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
                            <Select onValueChange={(val) => setValue("process", Number(val), { shouldValidate: true })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un proceso" />
                                </SelectTrigger>
                                <SelectContent>
                                    {processes.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
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
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            />
                        </div>

                        <input type="hidden" {...register("status", { required: "El estado es obligatorio" })} />
                        {catalogError && (
                            <div className="text-destructive text-xs">{catalogError}</div>
                        )}

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate("/scenarios")}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || isCatalogLoading || !registeredStatusId}
                                className="gap-2"
                                onClick={() => {
                                    if (registeredStatusId) {
                                        setValue("status", registeredStatusId, { shouldValidate: true });
                                    }
                                }}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Guardar Escenario
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
