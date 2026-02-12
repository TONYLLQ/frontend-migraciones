export type UserRole = 'Coordinator' | 'Analyst' | 'User';

export type ProcessType = 'Control Migratorio' | 'Nacionalización' | 'Emisión de Documentos' | 'Inmigración';

export type ScenarioStatus =
  | 'Registered'
  | 'Assigned'
  | 'Analysis'
  | 'Evaluation'
  | 'Prioritization'
  | 'Action'
  | 'Monitoring';

export type RuleDimension = 'Uniqueness' | 'Integrity' | 'Consistency' | 'Exactness';

export type RuleActionType = 'Preventive' | 'Manual' | 'Massive';

export type ActionStatus = 'Pending' | 'Executed';

export interface DataQualityRuleAction {
  type: RuleActionType;
  description: string;
}

export interface DataQualityRule {
  id: string;
  name: string;
  isActive: boolean;
  dimension: RuleDimension;
  sqlQuery: string;
  actions: DataQualityRuleAction[];
}

export interface ScenarioAction {
  id: string;
  description: string;
  status: ActionStatus;
  correctionQuery?: string;
  evidenceUrl?: string;
  responsibleId: string;
  ruleId?: string; // Vinculación con la regla de origen
}

export interface ScenarioHistory {
  status: ScenarioStatus;
  changedAt: string;
  changedBy: string;
  comment?: string;
}

export interface DataQualityScenario {
  id: string;
  title: string;
  process: ProcessType;
  status: ScenarioStatus;
  analystId: string;
  createdAt: string;
  rules: DataQualityRule[];
  actions: ScenarioAction[];
  history: ScenarioHistory[];
  documents: {
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }[];
  archive?: string | null;
  archiveUploadedAt?: string | null;
  archiveStageId?: number | null;
}
