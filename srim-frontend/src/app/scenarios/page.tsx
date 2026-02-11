import { Link } from "react-router-dom"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function ScenariosPage() {
    const { user, isCoordinator, isLoading } = useCurrentUser();

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
                {isCoordinator && (
                    <Link to="/scenarios/new">
                        <Button className="gap-2 shadow-lg">
                            <Plus className="h-4 w-4" /> Nuevo Escenario
                        </Button>
                    </Link>
                )}
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por ID o título..."
                        className="pl-9 bg-white shadow-sm"
                    />
                </div>
                <Button variant="outline" className="gap-2 bg-white shadow-sm">
                    <Filter className="h-4 w-4" /> Filtros
                </Button>
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
                                <tr>
                                    <td colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No se encontraron escenarios con los filtros actuales.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
