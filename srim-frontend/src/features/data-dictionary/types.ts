export type ApiTableCatalog = {
  id: number;
  name: string;
  schema?: string | null;
  description?: string | null;
  source_system?: string | null;
  owner?: string | null;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiTableField = {
  id: number;
  table: number;
  name: string;
  description?: string | null;
  data_type?: number | null;
  data_type_code?: string | null;
  data_type_name?: string | null;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  max_length?: number | null;
  precision?: number | null;
  scale?: number | null;
  default_value?: string | null;
  is_indexed: boolean;
  analysis_required: boolean;
  analysis_notes?: string | null;
  sample_values?: string | null;
  last_verified_at?: string | null;
  analysis_rules?: string[];
  created_at: string;
  updated_at: string;
};

export type ApiDataType = {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  order: number;
};
