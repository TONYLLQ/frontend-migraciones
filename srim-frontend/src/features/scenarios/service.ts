import { http } from "@/lib/http";
import { type CreateScenarioDTO, type Scenario } from "./types";

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
    }
};
