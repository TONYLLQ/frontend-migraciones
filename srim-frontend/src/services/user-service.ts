import { http } from "@/lib/http";

export interface User {
    id: string;
    email: string;
    username: string; // Django User model has username
    first_name: string;
    last_name: string;
    role: 'COORDINATOR' | 'ANALYST' | 'VIEWER';
}

export async function getCurrentUser(): Promise<User> {
    const { data } = await http.get<User>("/api/accounts/users/me/");
    return data;
}

export async function getAnalysts(): Promise<User[]> {
    const { data } = await http.get<User[]>("/api/accounts/users/analysts/");
    return data;
}
