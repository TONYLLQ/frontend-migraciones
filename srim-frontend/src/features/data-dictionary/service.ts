import { http } from "@/lib/http";
import type { ApiTableCatalog, ApiTableField, ApiDataType } from "./types";

export const dataDictionaryService = {
  getTables: async () => {
    const { data } = await http.get<ApiTableCatalog[]>("/api/data-dictionary/tables/");
    return data;
  },
  getFields: async () => {
    const { data } = await http.get<ApiTableField[]>("/api/data-dictionary/fields/");
    return data;
  },
  getDataTypes: async () => {
    const { data } = await http.get<ApiDataType[]>("/api/data-dictionary/data-types/");
    return data;
  },
  createTable: async (payload: {
    name: string;
    schema?: string | null;
    description?: string | null;
    source_system?: string | null;
    owner?: string | null;
    is_active?: boolean;
    metadata?: Record<string, unknown> | null;
  }) => {
    const { data } = await http.post<ApiTableCatalog>("/api/data-dictionary/tables/", payload);
    return data;
  },
  createField: async (payload: {
    table: number;
    name: string;
    description?: string | null;
    data_type?: string | null;
    is_nullable?: boolean;
    is_primary_key?: boolean;
    is_foreign_key?: boolean;
    max_length?: number | null;
    precision?: number | null;
    scale?: number | null;
    default_value?: string | null;
    is_indexed?: boolean;
    analysis_required?: boolean;
    analysis_notes?: string | null;
    sample_values?: string | null;
  }) => {
    const { data } = await http.post<ApiTableField>("/api/data-dictionary/fields/", payload);
    return data;
  },
  updateField: async (id: number, payload: Partial<{
    table: number;
    name: string;
    description?: string | null;
    data_type?: number | null;
    is_nullable?: boolean;
    is_primary_key?: boolean;
    is_foreign_key?: boolean;
    max_length?: number | null;
    precision?: number | null;
    scale?: number | null;
    default_value?: string | null;
    is_indexed?: boolean;
    analysis_required?: boolean;
    analysis_notes?: string | null;
    sample_values?: string | null;
    analysis_rules?: string[];
  }>) => {
    const { data } = await http.patch<ApiTableField>(`/api/data-dictionary/fields/${id}/`, payload);
    return data;
  },
};
