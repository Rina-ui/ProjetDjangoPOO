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

export const login = async (username: string, password: string): Promise<AuthUser> => {
    const response = await api.get<AuthUser[]>("utilisateurs/", {
        auth: {
            username,
            password,
        },
    });

    const user = response.data?.[0];

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