import { DataQualityScenario, UserRole, DataQualityRule } from '@/types/data-quality';

export const MOCK_USERS = [
  { id: 'u1', name: 'Carlos Rodriguez', role: 'Coordinator' as UserRole },
  { id: 'u2', name: 'Ana Martinez', role: 'Analyst' as UserRole },
  { id: 'u3', name: 'Roberto Gomez', role: 'Analyst' as UserRole },
];

export const GLOBAL_RULES_CATALOG: DataQualityRule[] = [
  { 
    id: 'R-01', 
    name: 'Validación de Correo Institucional', 
    isActive: true, 
    dimension: 'Integrity', 
    sqlQuery: 'SELECT * FROM users WHERE email NOT LIKE "%@institucion.gob%"',
    actions: [
      { type: 'Preventive', description: 'Rechazar registro en formulario' },
      { type: 'Manual', description: 'Notificar al usuario para corrección' }
    ]
  },
  { 
    id: 'R-02', 
    name: 'Control de Mayúsculas en Nombres', 
    isActive: true, 
    dimension: 'Consistency', 
    sqlQuery: 'SELECT id, name FROM people WHERE name != UPPER(name)',
    actions: [
      { type: 'Massive', description: 'Script de normalización' },
      { type: 'Preventive', description: 'Forzar mayúsculas en API' }
    ]
  },
  { 
    id: 'R-03', 
    name: 'Formato de Fecha ISO', 
    isActive: true, 
    dimension: 'Exactness', 
    sqlQuery: 'SELECT * FROM events WHERE TRY_CAST(event_date AS DATE) IS NULL',
    actions: [
      { type: 'Manual', description: 'Revisión por oficial de datos' }
    ]
  },
  { 
    id: 'R-04', 
    name: 'Unicidad de DNI', 
    isActive: true, 
    dimension: 'Uniqueness', 
    sqlQuery: 'SELECT dni, count(*) FROM identity_cards GROUP BY dni HAVING count(*) > 1',
    actions: [
      { type: 'Massive', description: 'Depuración por fecha' },
      { type: 'Manual', description: 'Fusión de expedientes duplicados' }
    ]
  }
];

export const MOCK_SCENARIOS: DataQualityScenario[] = [
  {
    id: 'SC-001',
    title: 'Validación de Pasaportes Vencidos',
    process: 'Control Migratorio',
    status: 'Analysis',
    analystId: 'u2',
    createdAt: '2024-03-01T10:00:00Z',
    rules: [GLOBAL_RULES_CATALOG[0]],
    actions: [],
    history: [
      { status: 'Registered', changedAt: '2024-03-01T10:00:00Z', changedBy: 'u1' },
      { status: 'Assigned', changedAt: '2024-03-02T09:00:00Z', changedBy: 'u1', comment: 'Asignado para análisis profundo' }
    ],
    documents: [
      { id: 'd1', name: 'Requerimiento_Tecnico_PAS.pdf', url: '#', uploadedAt: '2024-03-01T10:15:00Z' }
    ]
  },
  {
    id: 'SC-002',
    title: 'Duplicidad de Documentos de Identidad',
    process: 'Nacionalización',
    status: 'Action',
    analystId: 'u2',
    createdAt: '2024-02-20T08:30:00Z',
    rules: [GLOBAL_RULES_CATALOG[3]],
    actions: [
      { id: 'a1', description: 'Ejecutar script de depuración', status: 'Pending', responsibleId: 'u2', ruleId: 'R-04' },
      { id: 'a3', description: 'Fusión de expedientes duplicados', status: 'Pending', responsibleId: 'u2', ruleId: 'R-04' }
    ],
    history: [
      { status: 'Registered', changedAt: '2024-02-20T08:30:00Z', changedBy: 'u1' },
      { status: 'Assigned', changedAt: '2024-02-21T11:00:00Z', changedBy: 'u1' },
      { status: 'Analysis', changedAt: '2024-02-22T14:00:00Z', changedBy: 'u2' },
      { status: 'Evaluation', changedAt: '2024-02-23T10:00:00Z', changedBy: 'u2' },
      { status: 'Prioritization', changedAt: '2024-02-24T16:00:00Z', changedBy: 'u2' },
      { status: 'Action', changedAt: '2024-02-25T09:00:00Z', changedBy: 'u2' }
    ],
    documents: []
  },
  {
    id: 'SC-003',
    title: 'Consistencia de Fechas de Ingreso',
    process: 'Inmigración',
    status: 'Monitoring',
    analystId: 'u3',
    createdAt: '2024-01-15T12:00:00Z',
    rules: [GLOBAL_RULES_CATALOG[1]],
    actions: [
      { id: 'a2', description: 'Actualizar logs de auditoría', status: 'Executed', responsibleId: 'u3', ruleId: 'R-02' }
    ],
    history: [
      { status: 'Monitoring', changedAt: '2024-02-28T10:00:00Z', changedBy: 'u3' }
    ],
    documents: []
  }
];
