import { http } from "@/lib/http";
import type {
  ApiActionType,
  ApiQualityRule,
  ApiRuleAction,
  ApiRuleDimension,
  CreateRuleActionPayload,
  CreateRulePayload,
  UpdateRulePayload,
} from "./types";

export const rulesService = {
  getDimensions: async () => {
    const { data } = await http.get<ApiRuleDimension[]>("/api/catalog/rule-dimensions/");
    return data;
  },
  getActionTypes: async () => {
    const { data } = await http.get<ApiActionType[]>("/api/catalog/action-types/");
    return data;
  },
  getRules: async () => {
    const { data } = await http.get<ApiQualityRule[]>("/api/catalog/quality-rules/");
    return data;
  },
  createRule: async (payload: CreateRulePayload) => {
    const { data } = await http.post<ApiQualityRule>("/api/catalog/quality-rules/", payload);
    return data;
  },
  updateRule: async (id: string, payload: UpdateRulePayload) => {
    const { data } = await http.patch<ApiQualityRule>(`/api/catalog/quality-rules/${id}/`, payload);
    return data;
  },
  createRuleAction: async (payload: CreateRuleActionPayload) => {
    const { data } = await http.post<ApiRuleAction>("/api/catalog/rule-actions/", payload);
    return data;
  },
  deleteRuleAction: async (id: number) => {
    await http.delete(`/api/catalog/rule-actions/${id}/`);
  },
};
