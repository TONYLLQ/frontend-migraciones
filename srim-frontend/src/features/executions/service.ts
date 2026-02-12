import { http } from "@/lib/http";

export type RuleExecution = {
  id: string;
  rule: string;
  scenario: string;
  status: number | null;
  requested_by?: string | null;
  sql_snapshot?: string | null;
  rows_affected?: number | null;
  result_sample?: unknown;
  error_message?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at?: string;
};

export const executionsService = {
  execute: async (ruleId: string, scenarioId: string) => {
    const { data } = await http.post<RuleExecution>(
      "/api/executions/executions/execute/",
      { rule: ruleId, scenario: scenarioId }
    );
    return data;
  },
  getById: async (executionId: string) => {
    const { data } = await http.get<RuleExecution>(
      `/api/executions/executions/${executionId}/`
    );
    return data;
  },
};
