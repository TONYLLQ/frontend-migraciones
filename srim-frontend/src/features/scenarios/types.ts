export type ScenarioStatusCode =
    | 'REGISTRADO'
    | 'ASIGNADO'
    | 'ANALISIS'
    | 'EVALUACION'
    | 'VALIDACION'
    | 'ACCION'
    | 'MONITOREO';

export type ScenarioProcessCode =
    | 'CONTROL_MIGRATORIO'
    | 'NACIONALIZACION'
    | 'EMISION_DOCUMENTOS'
    | 'INMIGRACION';

export type ApiScenarioProcess = {
    id: number;
    code: ScenarioProcessCode;
    name: string;
    is_active: boolean;
    order: number;
};

export type ApiScenarioStatus = {
    id: number;
    code: ScenarioStatusCode;
    name: string;
    is_active: boolean;
    order: number;
    is_terminal: boolean;
    requires_all_actions_executed: boolean;
};

export type ApiScenarioTransition = {
    id: number;
    from_status: number;
    from_status_code: ScenarioStatusCode;
    to_status: number;
    to_status_code: ScenarioStatusCode;
    allow_coordinator: boolean;
    allow_analyst: boolean;
    allow_viewer: boolean;
    is_active: boolean;
};

export interface Scenario {
    id: string; // UUID
    title: string;
    description?: string | null;
    archive?: string | null;
    archive_uploaded_at?: string | null;
    archive_stage?: number | null;
    process: number;
    process_code: ScenarioProcessCode;
    process_name: string;
    status: number;
    status_code: ScenarioStatusCode;
    status_name: string;

    // Metadata
    created_at: string;
    created_by?: string;
    analyst?: string;
    analyst_email?: string | null;
    analyst_name?: string | null;

    // Counts for list view
    rules_count?: number;
    open_actions_count?: number;

    // Optional detail fields
    rules?: string[];
    operational_actions?: ApiScenarioOperationalAction[];
    history?: ApiScenarioHistory[];
}

export type ApiScenarioOperationalAction = {
    id: string;
    scenario: string;
    rule: string;
    rule_name: string;
    description: string;
    status: number;
    status_code: string;
    status_name: string;
    responsible: string | null;
    responsible_email: string | null;
    evidence_url?: string | null;
    correction_query?: string | null;
    created_at: string;
};

export type ApiScenarioHistory = {
    id: number;
    status: number;
    status_code: string;
    status_name: string;
    changed_at: string;
    changed_by: string | null;
    changed_by_email: string | null;
    comment: string | null;
};

export interface CreateScenarioDTO {
    title: string;
    description?: string | null;
    process: number;
    status: number;
}

export const SCENARIO_STATUS_LABELS: Record<ScenarioStatusCode, string> = {
    'REGISTRADO': 'Registrado',
    'ASIGNADO': 'Asignado',
    'ANALISIS': 'En Análisis',
    'EVALUACION': 'Evaluación',
    'VALIDACION': 'Validación',
    'ACCION': 'En Acción',
    'MONITOREO': 'Monitoreo'
};

export const SCENARIO_PROCESS_LABELS: Record<ScenarioProcessCode, string> = {
    'CONTROL_MIGRATORIO': 'Control Migratorio',
    'NACIONALIZACION': 'Nacionalización',
    'EMISION_DOCUMENTOS': 'Emisión de Documentos',
    'INMIGRACION': 'Inmigración'
};
