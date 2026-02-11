import { http } from "@/lib/http";
import { type LoginRequest, type LoginResponse } from "@/lib/auth";

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>("/api/token/", payload);
    return data;
}
