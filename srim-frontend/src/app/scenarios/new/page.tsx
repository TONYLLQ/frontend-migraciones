"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { SCENARIO_PROCESS_LABELS, type CreateScenarioDTO, type ScenarioProcess } from "@/features/scenarios/types"
import { scenarioService } from "@/features/scenarios/service"
import { useCurrentUser } from "@/hooks/use-current-user"

export default function NewScenarioPage() {
    const navigate = useNavigate()
    const { isCoordinator } = useCurrentUser()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateScenarioDTO>()

    const onSubmit = async (data: CreateScenarioDTO) => {
        setIsLoading(true)
        setError(null)
        try {
            await scenarioService.create(data)
            navigate("/scenarios")
        } catch (err) {
            console.error(err);
            setError("Error al crear el escenario. Por favor intente nuevamente.")
        } finally {
            setIsLoading(false)
        }
    }

    // Security check (UI level)
    if (!isCoordinator) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-semibold text-destructive">Acceso Denegado</h2>
                <p>Solo los coordinadores pueden crear escenarios.</p>
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
                            <Select onValueChange={(val) => setValue("process", val as ScenarioProcess)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione un proceso" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(SCENARIO_PROCESS_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                placeholder="Describa el objetivo y alcance de este escenario de calidad..."
                                className="min-h-[120px]"
                                {...register("description", { required: "La descripción es obligatoria" })}
                            />
                            {errors.description && <span className="text-destructive text-xs">{errors.description.message}</span>}
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate("/scenarios")}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading} className="gap-2">
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
