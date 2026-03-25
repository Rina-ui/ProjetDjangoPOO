import api from "./api";

export type AuthUser = {
    id: number;
    fullName?: string;
    full_name?: string;
    email?: string;
    username?: string;
    role: string;
    token?: string;
};

type RegisterPayload = {
    username: string;
    password: string;
    role: "LOCATAIRE" | "PROPRIETAIRE" | "ADMIN";
    profil?: {
        nom: string;
        prenom: string;
        email: string;
        telephone: string;
        profession?: string;
        adresse?: string;
        actif?: boolean;
    };
};

const API_ROOT_URL = import.meta.env.VITE_API_ROOT_URL || "http://127.0.0.1:8000";

const getTokenFromPayload = (data: any): string | undefined => {
    const tokenCandidates = [
        data?.token,
        data?.access,
        data?.access_token,
        data?.auth_token,
        data?.jwt,
        data?.key,
    ];

    const found = tokenCandidates.find((item) => typeof item === "string" && item.trim().length > 0);
    return found as string | undefined;
};

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
    const token = getTokenFromPayload(response.data);

    if (!user) {
        throw new Error("Utilisateur introuvable");
    }

    if (token) {
        localStorage.setItem("auth_token", token);
    } else {
        // Evite de reutiliser un token precedent d'un autre utilisateur.
        localStorage.removeItem("auth_token");
    }

    return {
        ...user,
        token,
    };
};

export const register = async (payload: RegisterPayload) => {
    const userResponse = await api.post("utilisateurs/", {
        username: payload.username,
        password: payload.password,
        role: payload.role,
    });

    const userData = userResponse?.data;
    const utilisateurId =
        userData?.id ||
        userData?.utilisateur?.id ||
        userData?.data?.id;

    if (!utilisateurId || typeof utilisateurId !== "number") {
        throw new Error("Utilisateur cree mais id introuvable dans la reponse backend.");
    }

    if (payload.role === "PROPRIETAIRE") {
        const fallbackNom = payload.username.split("@")[0] || "Nom";
        const profilData = payload.profil || {
            nom: fallbackNom,
            prenom: "Prenom",
            email: payload.username,
            telephone: "90000000",
            adresse: "Adresse non renseignee",
            actif: true,
        };

        await api.post("proprietaires/", {
            utilisateur: utilisateurId,
            nom: profilData.nom,
            prenom: profilData.prenom,
            email: profilData.email,
            telephone: profilData.telephone,
            adresse: profilData.adresse || "Adresse non renseignee",
            actif: profilData.actif ?? true,
        });
    }

    if (payload.role === "LOCATAIRE") {
        const fallbackNom = payload.username.split("@")[0] || "Nom";
        const profilData = payload.profil || {
            nom: fallbackNom,
            prenom: "Prenom",
            email: payload.username,
            telephone: "90000000",
            profession: "Sans profession",
            actif: true,
        };

        await api.post("locataires/", {
            utilisateur: utilisateurId,
            nom: profilData.nom,
            prenom: profilData.prenom,
            email: profilData.email,
            telephone: profilData.telephone,
            profession: profilData.profession || "Sans profession",
            actif: profilData.actif ?? true,
        });
    }

    return userResponse;
};

export const logout = async () => {
    // Si tu utilises les sessions Django, adapte ici vers ton endpoint dédié (ex: auth/logout/)
    localStorage.removeItem("auth_token");
    return Promise.resolve();
};