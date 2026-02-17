import { useEffect, useMemo, useState } from "react";
import { Search, Database, Loader2, Plus } from "lucide-react";
import { dataDictionaryService } from "@/features/data-dictionary/service";
import type { ApiTableCatalog, ApiTableField, ApiDataType } from "@/features/data-dictionary/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatTableName(table?: ApiTableCatalog) {
  if (!table) return "-";
  return table.schema ? `${table.schema}.${table.name}` : table.name;
}

export default function DataDictionaryPage() {
  const [tables, setTables] = useState<ApiTableCatalog[]>([]);
  const [fields, setFields] = useState<ApiTableField[]>([]);
  const [dataTypes, setDataTypes] = useState<ApiDataType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTable, setFilterTable] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"field" | "table">("field");
  const [isSavingTable, setIsSavingTable] = useState(false);
  const [isSavingField, setIsSavingField] = useState(false);

  const [tableForm, setTableForm] = useState({
    name: "",
    schema: "",
    description: "",
    source_system: "",
    owner: "",
    is_active: true,
  });

  const [fieldForm, setFieldForm] = useState({
    table: 0,
    name: "",
    description: "",
    data_type: 0,
    is_nullable: true,
    is_primary_key: false,
    is_foreign_key: false,
    is_indexed: false,
    default_value: "",
    max_length: "",
    precision: "",
    scale: "",
    analysis_required: false,
    analysis_notes: "",
    sample_values: "",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [tablesData, fieldsData, dataTypesData] = await Promise.all([
          dataDictionaryService.getTables(),
          dataDictionaryService.getFields(),
          dataDictionaryService.getDataTypes(),
        ]);
        if (!active) return;
        setTables(tablesData);
        setFields(fieldsData);
        setDataTypes(dataTypesData);
      } catch (err) {
        console.error(err);
        if (active) setLoadError("No se pudo cargar el diccionario de datos.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (tables.length > 0 && !fieldForm.table) {
      setFieldForm((prev) => ({ ...prev, table: tables[0].id }));
    }
  }, [tables, fieldForm.table]);

  useEffect(() => {
    if (dataTypes.length > 0 && !fieldForm.data_type) {
      setFieldForm((prev) => ({ ...prev, data_type: dataTypes[0].id }));
    }
  }, [dataTypes, fieldForm.data_type]);

  const tablesById = useMemo(() => {
    const map = new Map<number, ApiTableCatalog>();
    tables.forEach((t) => map.set(t.id, t));
    return map;
  }, [tables]);

  const filteredFields = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return fields.filter((field) => {
      const table = tablesById.get(field.table);
      const matchesTable =
        filterTable === "all" || String(field.table) === String(filterTable);
      const matchesSearch =
        term === "" ||
        field.name.toLowerCase().includes(term) ||
        (field.description || "").toLowerCase().includes(term) ||
        (table?.name || "").toLowerCase().includes(term) ||
        (table?.schema || "").toLowerCase().includes(term);
      return matchesTable && matchesSearch;
    });
  }, [fields, tablesById, searchTerm, filterTable]);

  const handleCreateTable = async () => {
    if (!tableForm.name.trim()) {
      toast({ variant: "destructive", title: "Error", description: "El nombre de la tabla es obligatorio." });
      return;
    }
    setIsSavingTable(true);
    try {
      const created = await dataDictionaryService.createTable({
        name: tableForm.name.trim(),
        schema: tableForm.schema.trim() || null,
        description: tableForm.description.trim() || null,
        source_system: tableForm.source_system.trim() || null,
        owner: tableForm.owner.trim() || null,
        is_active: tableForm.is_active,
      });
      setTables((prev) => [created, ...prev]);
      setTableForm({
        name: "",
        schema: "",
        description: "",
        source_system: "",
        owner: "",
        is_active: true,
      });
      setActiveTab("field");
      toast({ title: "Tabla creada", description: "La tabla fue registrada correctamente." });
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail || err?.response?.data?.name;
      toast({ variant: "destructive", title: "Error", description: detail || "No se pudo crear la tabla." });
    } finally {
      setIsSavingTable(false);
    }
  };

  const handleCreateField = async () => {
    if (!fieldForm.table) {
      toast({ variant: "destructive", title: "Error", description: "Selecciona una tabla." });
      return;
    }
    if (!fieldForm.data_type) {
      toast({ variant: "destructive", title: "Error", description: "Selecciona un tipo de dato." });
      return;
    }
    if (!fieldForm.name.trim()) {
      toast({ variant: "destructive", title: "Error", description: "El nombre del campo es obligatorio." });
      return;
    }
    setIsSavingField(true);
    try {
      const created = await dataDictionaryService.createField({
        table: fieldForm.table,
        name: fieldForm.name.trim(),
        description: fieldForm.description.trim() || null,
        data_type: fieldForm.data_type,
        is_nullable: fieldForm.is_nullable,
        is_primary_key: fieldForm.is_primary_key,
        is_foreign_key: fieldForm.is_foreign_key,
        is_indexed: fieldForm.is_indexed,
        default_value: fieldForm.default_value.trim() || null,
        max_length: fieldForm.max_length ? Number(fieldForm.max_length) : null,
        precision: fieldForm.precision ? Number(fieldForm.precision) : null,
        scale: fieldForm.scale ? Number(fieldForm.scale) : null,
        analysis_required: fieldForm.analysis_required,
        analysis_notes: fieldForm.analysis_notes.trim() || null,
        sample_values: fieldForm.sample_values.trim() || null,
      });
      setFields((prev) => [created, ...prev]);
      setFieldForm((prev) => ({
        ...prev,
        name: "",
        description: "",
        data_type: dataTypes[0]?.id ?? 0,
        is_primary_key: false,
        is_foreign_key: false,
        is_indexed: false,
        default_value: "",
        max_length: "",
        precision: "",
        scale: "",
        analysis_required: false,
        analysis_notes: "",
        sample_values: "",
      }));
      setIsDialogOpen(false);
      toast({ title: "Campo creado", description: "El campo fue registrado correctamente." });
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail || err?.response?.data?.name;
      toast({ variant: "destructive", title: "Error", description: detail || "No se pudo crear el campo." });
    } finally {
      setIsSavingField(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Diccionario de Datos</h2>
          <p className="text-muted-foreground">
            Campos registrados durante el analisis de reglas y calidad.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white px-3 py-1">
            {isLoading ? "Cargando..." : `${filteredFields.length} campos`}
          </Badge>
          <Button className="bg-accent hover:bg-accent/90" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo registro
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por campo, tabla o descripcion..."
            className="pl-10 bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterTable} onValueChange={setFilterTable}>
          <SelectTrigger className="w-[260px] bg-white shadow-sm">
            <SelectValue placeholder="Filtrar por tabla" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las tablas</SelectItem>
            {tables.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {formatTableName(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando diccionario...
        </div>
      )}
      {loadError && <div className="text-destructive text-sm">{loadError}</div>}

      {!isLoading && !loadError && (
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              Campos Registrados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tabla</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Campo</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Claves</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Notas</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredFields.length === 0 && (
                    <tr>
                      <td colSpan={5} className="h-24 text-center text-muted-foreground">
                        No hay campos registrados con los filtros actuales.
                      </td>
                    </tr>
                  )}
                  {filteredFields.map((field) => {
                    const table = tablesById.get(field.table);
                    return (
                      <tr key={field.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="px-4 py-4">
                          <div className="font-medium text-primary">{formatTableName(table)}</div>
                          {table?.source_system && (
                            <div className="text-[10px] text-muted-foreground">
                              Origen: {table.source_system}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-primary">{field.name}</div>
                          {field.description && (
                            <div className="text-xs text-muted-foreground">{field.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="secondary" className="text-[10px]">
                            {field.data_type_code || field.data_type_name || "Sin tipo"}
                          </Badge>
                          {!field.is_nullable && (
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              NOT NULL
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 space-x-2">
                          {field.is_primary_key && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px]">
                              PK
                            </Badge>
                          )}
                          {field.is_foreign_key && (
                            <Badge className="bg-sky-100 text-sky-800 border-none text-[10px]">
                              FK
                            </Badge>
                          )}
                          {field.is_indexed && (
                            <Badge className="bg-slate-100 text-slate-800 border-none text-[10px]">
                              INDEX
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs text-muted-foreground">
                            {field.analysis_notes || field.sample_values || "-"}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>Nuevo registro</DialogTitle>
            <DialogDescription>
              Registra una tabla o un campo en el diccionario de datos.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "field" | "table")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="field">Campo</TabsTrigger>
              <TabsTrigger value="table">Tabla</TabsTrigger>
            </TabsList>

            <TabsContent value="field" className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Tabla</Label>
                  <Select
                    value={fieldForm.table ? String(fieldForm.table) : ""}
                    onValueChange={(v) => setFieldForm((prev) => ({ ...prev, table: Number(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una tabla" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.length === 0 && (
                        <SelectItem value="0" disabled>
                          No hay tablas registradas
                        </SelectItem>
                      )}
                      {tables.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {formatTableName(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tables.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Primero crea una tabla en la pestaña "Tabla".
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Nombre del campo</Label>
                  <Input
                    placeholder="Ej: numero_documento"
                    value={fieldForm.name}
                    onChange={(e) => setFieldForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Tipo de dato</Label>
                  <Select
                    value={fieldForm.data_type ? String(fieldForm.data_type) : ""}
                    onValueChange={(v) => setFieldForm((prev) => ({ ...prev, data_type: Number(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo de dato" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataTypes.length === 0 && (
                        <SelectItem value="0" disabled>
                          No hay tipos de datos registrados
                        </SelectItem>
                      )}
                      {dataTypes.map((dt) => (
                        <SelectItem key={dt.id} value={String(dt.id)}>
                          {dt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {dataTypes.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Registra tipos de datos en el catalogo antes de crear campos.
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Valor por defecto</Label>
                  <Input
                    placeholder="Ej: NULL"
                    value={fieldForm.default_value}
                    onChange={(e) => setFieldForm((prev) => ({ ...prev, default_value: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Descripcion</Label>
                <Textarea
                  placeholder="Describe el campo y su uso."
                  value={fieldForm.description}
                  onChange={(e) => setFieldForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="grid gap-2">
                  <Label>Longitud</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Max"
                    value={fieldForm.max_length}
                    onChange={(e) => setFieldForm((prev) => ({ ...prev, max_length: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Precision</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Precision"
                    value={fieldForm.precision}
                    onChange={(e) => setFieldForm((prev) => ({ ...prev, precision: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Escala</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Escala"
                    value={fieldForm.scale}
                    onChange={(e) => setFieldForm((prev) => ({ ...prev, scale: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Valores muestra</Label>
                  <Input
                    placeholder="Ej: 001, 002"
                    value={fieldForm.sample_values}
                    onChange={(e) => setFieldForm((prev) => ({ ...prev, sample_values: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium">Permite nulos</div>
                    <div className="text-xs text-muted-foreground">Marca si el campo acepta NULL.</div>
                  </div>
                  <Switch
                    checked={fieldForm.is_nullable}
                    onCheckedChange={(v) => setFieldForm((prev) => ({ ...prev, is_nullable: v }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium">Campo indexado</div>
                    <div className="text-xs text-muted-foreground">Utiliza indice para busqueda.</div>
                  </div>
                  <Switch
                    checked={fieldForm.is_indexed}
                    onCheckedChange={(v) => setFieldForm((prev) => ({ ...prev, is_indexed: v }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium">Clave primaria</div>
                    <div className="text-xs text-muted-foreground">Identificador principal.</div>
                  </div>
                  <Switch
                    checked={fieldForm.is_primary_key}
                    onCheckedChange={(v) => setFieldForm((prev) => ({ ...prev, is_primary_key: v }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium">Clave foranea</div>
                    <div className="text-xs text-muted-foreground">Relacion con otra tabla.</div>
                  </div>
                  <Switch
                    checked={fieldForm.is_foreign_key}
                    onCheckedChange={(v) => setFieldForm((prev) => ({ ...prev, is_foreign_key: v }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Requiere analisis</div>
                  <div className="text-xs text-muted-foreground">Marca si necesita validacion.</div>
                </div>
                <Switch
                  checked={fieldForm.analysis_required}
                  onCheckedChange={(v) => setFieldForm((prev) => ({ ...prev, analysis_required: v }))}
                />
              </div>

              <div className="grid gap-2">
                <Label>Notas de analisis</Label>
                <Textarea
                  placeholder="Observaciones, reglas vinculadas, validaciones."
                  value={fieldForm.analysis_notes}
                  onChange={(e) => setFieldForm((prev) => ({ ...prev, analysis_notes: e.target.value }))}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateField}
                  disabled={isSavingField || tables.length === 0 || dataTypes.length === 0}
                >
                  {isSavingField ? "Guardando..." : "Guardar campo"}
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="table" className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Nombre de la tabla</Label>
                  <Input
                    placeholder="Ej: personas"
                    value={tableForm.name}
                    onChange={(e) => setTableForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Schema</Label>
                  <Input
                    placeholder="Ej: public"
                    value={tableForm.schema}
                    onChange={(e) => setTableForm((prev) => ({ ...prev, schema: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Descripcion</Label>
                <Textarea
                  placeholder="Descripcion funcional de la tabla."
                  value={tableForm.description}
                  onChange={(e) => setTableForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Sistema de origen</Label>
                  <Input
                    placeholder="Ej: SIM"
                    value={tableForm.source_system}
                    onChange={(e) => setTableForm((prev) => ({ ...prev, source_system: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Owner</Label>
                  <Input
                    placeholder="Ej: Calidad de Datos"
                    value={tableForm.owner}
                    onChange={(e) => setTableForm((prev) => ({ ...prev, owner: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Tabla activa</div>
                  <div className="text-xs text-muted-foreground">Visible para analisis.</div>
                </div>
                <Switch
                  checked={tableForm.is_active}
                  onCheckedChange={(v) => setTableForm((prev) => ({ ...prev, is_active: v }))}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTable} disabled={isSavingTable}>
                  {isSavingTable ? "Guardando..." : "Guardar tabla"}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
