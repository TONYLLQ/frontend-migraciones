export type ScenarioStatus =
    | 'REGISTRADO'
    | 'ASIGNADO'
    | 'ANALISIS'
    | 'EVALUACION'
    | 'VALIDACION'
    | 'ACCION'
    | 'MONITOREO';

export type ScenarioProcess =
    | 'CONTROL_MIGRATORIO'
    | 'NACIONALIZACION'
    | 'EMISION_DOCUMENTOS'
    | 'INMIGRACION';

export interface Scenario {
    id: string; // UUID
    title: string;
    description: string;
    process: ScenarioProcess;
    status: ScenarioStatus;

    // Metadata
    created_at: string;
    updated_at: string;
    owner_id?: string;
    analyst_id?: string;

    // Counts for list view
    rules_count?: number;
    open_actions_count?: number;
}

export interface CreateScenarioDTO {
    title: string;
    description: string;
    process: ScenarioProcess;
}

export const SCENARIO_STATUS_LABELS: Record<ScenarioStatus, string> = {
    'REGISTRADO': 'Registrado',
    'ASIGNADO': 'Asignado',
    'ANALISIS': 'En Análisis',
    'EVALUACION': 'Evaluación',
    'VALIDACION': 'Validación',
    'ACCION': 'En Acción',
    'MONITOREO': 'Monitoreo'
};

export const SCENARIO_PROCESS_LABELS: Record<ScenarioProcess, string> = {
    'CONTROL_MIGRATORIO': 'Control Migratorio',
    'NACIONALIZACION': 'Nacionalización',
    'EMISION_DOCUMENTOS': 'Emisión de Documentos',
    'INMIGRACION': 'Inmigración'
};
