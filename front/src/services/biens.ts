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

export type CreateBienPayload = {
    proprietaire: number;
    categorie: number;
    type_bien: number;
    adresse: string;
    description: string;
    photos: File[];
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

export const createBien = async (payload: CreateBienPayload) => {
    const formData = new FormData();

    formData.append("proprietaire", String(payload.proprietaire));
    formData.append("categorie", String(payload.categorie));
    formData.append("type_bien", String(payload.type_bien));
    formData.append("adresse", payload.adresse);
    formData.append("description", payload.description);
    formData.append("loyer_hc", String(payload.loyer_hc));
    formData.append("charges", String(payload.charges));
    formData.append("statut", payload.statut);

    payload.equipements.forEach((item) => {
        formData.append("equipements", item);
    });

    payload.photos.forEach((file) => {
        formData.append("photos", file, file.name);
    });

    return api.post("biens/", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

