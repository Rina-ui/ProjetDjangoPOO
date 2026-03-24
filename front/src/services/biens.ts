import api from "./api";

export type Categorie = {
    id: number;
    nom: string;
    description?: string;
    date_creation?: string;
};

export type TypeBien = {
    id: number;
    nom: string;
    description?: string;
    date_creation?: string;
    categorie: number;
};

export type Bien = {
    id: number;
    proprietaire: number | { id?: number; utilisateur?: number | { id?: number } };
    categorie: number;
    type_bien: number | null;
    adresse: string;
    description: string;
    photos: string[];
    equipements: string[];
    loyer_hc: number | string;
    charges: number | string;
    statut: "VACANT" | "LOUE" | "EN_TRAVAUX" | "EN_VENTE";
    date_creation?: string;
    photos_files?: Array<{ id: number; image?: string; image_url?: string }>;
};

type PaginatedResponse<T> = {
    results?: T[];
};

export type CreateBienPayload = {
    proprietaire: number;
    categorie: number;
    type_bien: number;
    adresse: string;
    description: string;
    photos?: File[];
    equipements: string[];
    loyer_hc: number;
    charges: number;
    statut: "VACANT" | "LOUE" | "EN_TRAVAUX";
};

export const fetchCategories = async (): Promise<Categorie[]> => {
    const response = await api.get<Categorie[]>("categories/");
    return response.data;
};

export const fetchTypesBien = async (): Promise<TypeBien[]> => {
    const response = await api.get<TypeBien[]>("types-bien/");
    return response.data;
};

const normalizeList = <T>(data: T[] | PaginatedResponse<T>): T[] => {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && Array.isArray(data.results)) {
        return data.results;
    }

    return [];
};

const extractOwnerId = (proprietaire: Bien["proprietaire"]): number | null => {
    if (typeof proprietaire === "number") {
        return proprietaire;
    }

    if (proprietaire && typeof proprietaire === "object") {
        if (typeof proprietaire.id === "number") {
            return proprietaire.id;
        }

        const utilisateur = proprietaire.utilisateur;
        if (typeof utilisateur === "number") {
            return utilisateur;
        }

        if (utilisateur && typeof utilisateur === "object" && typeof utilisateur.id === "number") {
            return utilisateur.id;
        }
    }

    return null;
};

export const fetchBiens = async (): Promise<Bien[]> => {
    const response = await api.get<Bien[] | PaginatedResponse<Bien>>("biens/");
    return normalizeList(response.data);
};

export const fetchBiensByOwner = async (ownerId: number): Promise<Bien[]> => {
    try {
        const filteredResponse = await api.get<Bien[] | PaginatedResponse<Bien>>("biens/", {
            params: { proprietaire: ownerId },
        });

        const filteredList = normalizeList(filteredResponse.data);
        if (filteredList.length > 0) {
            return filteredList;
        }
    } catch {
        // Fallback ci-dessous si le filtrage serveur n'est pas active.
    }

    const all = await fetchBiens();
    return all.filter((bien) => extractOwnerId(bien.proprietaire) === ownerId);
};

export const createBien = async (payload: CreateBienPayload) => {
    // Le backend stocke photos/equipements en JSONField: on envoie un vrai JSON.
    const body = {
        proprietaire: payload.proprietaire,
        categorie: payload.categorie,
        type_bien: payload.type_bien,
        adresse: payload.adresse,
        description: payload.description,
        photos: (payload.photos || []).map((item) => item.name),
        equipements: payload.equipements,
        loyer_hc: payload.loyer_hc,
        charges: payload.charges,
        statut: payload.statut,
    };

    return api.post("biens/", body, {
        headers: {
            "Content-Type": "application/json",
        },
    });
};

export const extractCreatedBienId = (data: unknown): number | null => {
    if (!data || typeof data !== "object") {
        return null;
    }

    const maybeObj = data as Record<string, unknown>;
    if (typeof maybeObj.id === "number") {
        return maybeObj.id;
    }

    const nestedData = maybeObj.data;
    if (nestedData && typeof nestedData === "object" && typeof (nestedData as Record<string, unknown>).id === "number") {
        return (nestedData as Record<string, number>).id;
    }

    const nestedBien = maybeObj.bien;
    if (nestedBien && typeof nestedBien === "object" && typeof (nestedBien as Record<string, unknown>).id === "number") {
        return (nestedBien as Record<string, number>).id;
    }

    return null;
};

export const uploadBienPhotos = async (bienId: number, files: File[]) => {
    if (!files.length) {
        return null;
    }

    const formData = new FormData();
    files.forEach((file) => {
        formData.append("photos", file);
    });

    try {
        // Ne pas forcer Content-Type ici: Axios ajoute automatiquement la boundary multipart.
        return await api.post(`biens/${bienId}/upload-photos/`, formData);
    } catch (error: any) {
        if (error?.response?.status !== 404) {
            throw error;
        }

        // Compatibilite si l'action DRF est exposee avec underscore.
        return api.post(`biens/${bienId}/upload_photos/`, formData);
    }
};

