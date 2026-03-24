import api from "./api";

export type AuthUser = {
    id: number;
    fullName?: string;
    full_name?: string;
    email?: string;
    username?: string;
    role: string;
};

type RegisterPayload = {
    username: string;
    password: string;
    role: "LOCATAIRE" | "PROPRIETAIRE" | "ADMIN";
};

const API_ROOT_URL = import.meta.env.VITE_API_ROOT_URL || "http://127.0.0.1:8000";

const extractLoginUser = (data: any): AuthUser | null => {
    if (data && typeof data === "object" && typeof data.id === "number") {
        return data as AuthUser;
    }

    if (data?.utilisateur && typeof data.utilisateur === "object" && typeof data.utilisateur.id === "number") {
        return data.utilisateur as AuthUser;
    }

    if (Array.isArray(data) && data[0] && typeof data[0].id === "number") {
        return data[0] as AuthUser;
    }

    return null;
};

export const login = async (username: string, password: string): Promise<AuthUser> => {
    const response = await api.post(`${API_ROOT_URL}/login/`, {
        username,
        password,
    });

    console.log("[POST /login/] response:", response.data);

    const user = extractLoginUser(response.data);

    if (!user) {
        throw new Error("Utilisateur introuvable");
    }

    return user;
};

export const register = async (payload: RegisterPayload) => {
    return api.post("utilisateurs/", {
        username: payload.username,
        password: payload.password,
        role: payload.role,
    });
};

export const logout = async () => {
    // Si tu utilises les sessions Django, adapte ici vers ton endpoint dédié (ex: auth/logout/)
    return Promise.resolve();
};