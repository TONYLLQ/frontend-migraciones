export type ApiRuleDimension = {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  order: number;
};

export type ApiActionType = {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  order: number;
};

export type ApiRuleAction = {
  id: number;
  action_type: number;
  action_type_code: string;
  action_type_name: string;
  description: string;
};

export type ApiQualityRule = {
  id: string;
  name: string;
  dimension: number;
  dimension_code: string;
  dimension_name: string;
  is_active: boolean;
  sql_query: string | null;
  actions: ApiRuleAction[];
};

export type CreateRulePayload = {
  name: string;
  dimension: number;
  is_active?: boolean;
  sql_query?: string | null;
};

export type UpdateRulePayload = Partial<CreateRulePayload>;

export type CreateRuleActionPayload = {
  rule: string;
  action_type: number;
  description: string;
};
