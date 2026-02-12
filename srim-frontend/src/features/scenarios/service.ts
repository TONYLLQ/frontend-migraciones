import { http } from "@/lib/http";
import { type CreateScenarioDTO, type Scenario, type ApiScenarioProcess, type ApiScenarioStatus, type ApiScenarioTransition } from "./types";

export const scenarioService = {
    getAll: async () => {
        const { data } = await http.get<Scenario[]>("/api/scenarios/scenarios/");
        return data;
    },

    getById: async (id: string) => {
        const { data } = await http.get<Scenario>(`/api/scenarios/scenarios/${id}/`);
        return data;
    },

    create: async (payload: CreateScenarioDTO) => {
        const { data } = await http.post<Scenario>("/api/scenarios/scenarios/", payload);
        return data;
    },
    createWithFile: async (payload: CreateScenarioDTO, file?: File | null) => {
        const form = new FormData();
        form.append("title", payload.title);
        if (payload.description) form.append("description", payload.description);
        if (payload.process) form.append("process", String(payload.process));
        if (payload.status) form.append("status", String(payload.status));
        if (file) form.append("archive", file);
        const { data } = await http.post<Scenario>("/api/scenarios/scenarios/", form);
        return data;
    },
    updateWithFile: async (scenarioId: string, payload: Partial<CreateScenarioDTO>, file?: File | null) => {
        const form = new FormData();
        if (payload.title) form.append("title", payload.title);
        if (payload.description) form.append("description", payload.description);
        if (payload.process) form.append("process", String(payload.process));
        if (payload.status) form.append("status", String(payload.status));
        if (file) form.append("archive", file);
        const { data } = await http.patch<Scenario>(`/api/scenarios/scenarios/${scenarioId}/`, form);
        return data;
    },
    getProcesses: async () => {
        const { data } = await http.get<ApiScenarioProcess[]>("/api/catalog/scenario-processes/");
        return data;
    },
    getStatuses: async () => {
        const { data } = await http.get<ApiScenarioStatus[]>("/api/catalog/scenario-statuses/");
        return data;
    },
    getTransitions: async () => {
        const { data } = await http.get<ApiScenarioTransition[]>("/api/catalog/scenario-transitions/");
        return data;
    },
    transition: async (scenarioId: string, toStatusId: number, comment?: string) => {
        const { data } = await http.post(`/api/scenarios/scenarios/${scenarioId}/transition/`, {
            to_status: toStatusId,
            comment: comment ?? "",
        });
        return data;
    },
    createScenarioRule: async (scenarioId: string, ruleId: string) => {
        const { data } = await http.post("/api/scenarios/scenario-rules/", {
            scenario: scenarioId,
            rule: ruleId,
        });
        return data;
    },
    unlinkScenarioRule: async (scenarioId: string, ruleId: string) => {
        const { data } = await http.post(`/api/scenarios/scenarios/${scenarioId}/unlink-rule/`, {
            rule: ruleId,
        });
        return data;
    },
    assignAnalyst: async (scenarioId: string, analystId: string) => {
        const { data } = await http.post(`/api/scenarios/scenarios/${scenarioId}/assign/`, {
            analyst: analystId,
        });
        return data;
    },
};
