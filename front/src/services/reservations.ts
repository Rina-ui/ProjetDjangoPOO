import api from "./api";

export type CreateReservationPayload = {
    id?: number;
    bien: number;
    locataire: number;
    date_debut: string;
    date_fin: string;
    message?: string;
    statut?: "EN_ATTENTE" | "CONFIRMEE" | "ANNULEE" | "TERMINEE";
};

type CreateReservationForUserPayload = Omit<CreateReservationPayload, "locataire">;

type LocataireApi = {
    id?: number;
    utilisateur?: number | { id?: number };
};

type PaginatedResponse<T> = {
    results?: T[];
};

export type Reservation = {
    id: number;
    bien: number | { id?: number };
    locataire_id?: number;
    locataire: number | { id?: number; utilisateur?: number | { id?: number } };
    date_debut: string;
    date_fin: string;
    message?: string;
    statut: "EN_ATTENTE" | "CONFIRMEE" | "ANNULEE" | "TERMINEE";
    date_creation?: string;
    date_modification?: string;
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

const extractUtilisateurId = (locataire: LocataireApi): number | null => {
    if (typeof locataire.utilisateur === "number") {
        return locataire.utilisateur;
    }

    if (locataire.utilisateur && typeof locataire.utilisateur === "object" && typeof locataire.utilisateur.id === "number") {
        return locataire.utilisateur.id;
    }

    return null;
};

const extractLocataireIdFromReservation = (reservation: Reservation): number | null => {
    if (typeof reservation.locataire_id === "number") {
        return reservation.locataire_id;
    }

    if (typeof reservation.locataire === "number") {
        return reservation.locataire;
    }

    if (reservation.locataire && typeof reservation.locataire === "object" && typeof reservation.locataire.id === "number") {
        return reservation.locataire.id;
    }

    return null;
};

const extractLocataireUserIdFromReservation = (reservation: Reservation): number | null => {
    if (!reservation.locataire || typeof reservation.locataire !== "object") {
        return null;
    }

    const utilisateur = reservation.locataire.utilisateur;
    if (typeof utilisateur === "number") {
        return utilisateur;
    }

    if (utilisateur && typeof utilisateur === "object" && typeof utilisateur.id === "number") {
        return utilisateur.id;
    }

    return null;
};

export const fetchLocataireProfileIdByUser = async (userId: number): Promise<number | null> => {
    try {
        const filtered = await api.get<LocataireApi[] | PaginatedResponse<LocataireApi>>("locataires/", {
            params: { utilisateur: userId },
        });

        const first = normalizeList(filtered.data).find((item) => extractUtilisateurId(item) === userId && typeof item.id === "number");
        if (first?.id) {
            return first.id;
        }
    } catch {
        // Fallback global ci-dessous.
    }

    try {
        const all = await api.get<LocataireApi[] | PaginatedResponse<LocataireApi>>("locataires/");
        const first = normalizeList(all.data).find((item) => extractUtilisateurId(item) === userId && typeof item.id === "number");
        return first?.id ?? null;
    } catch {
        return null;
    }
};

export const createReservation = async (payload: CreateReservationPayload) => {
    return api.post("reservations/", payload, {
        headers: {
            "Content-Type": "application/json",
        },
    });
};

export const fetchReservations = async (): Promise<Reservation[]> => {
    const response = await api.get<Reservation[] | PaginatedResponse<Reservation>>("reservations/");
    return normalizeList(response.data);
};

export const fetchReservationsForUser = async (userId: number): Promise<Reservation[]> => {
    const locataireId = await fetchLocataireProfileIdByUser(userId);

    const filterForCurrentUser = (items: Reservation[]) => {
        const filtered = items.filter((item) => {
            const reservationLocataireId = extractLocataireIdFromReservation(item);
            const reservationUserId = extractLocataireUserIdFromReservation(item);

            // Cas 1: le serializer expose locataire.utilisateur => filtrage strict user.
            if (typeof reservationUserId === "number") {
                return reservationUserId === userId;
            }

            // Cas 2: fallback avec locataireId si disponible.
            if (typeof locataireId === "number") {
                return reservationLocataireId === locataireId;
            }

            // Cas 3: impossible d'identifier l'appartenance -> on bloque par securite.
            return false;
        });

        return filtered;
    };

    try {
        const response = await api.get<Reservation[] | PaginatedResponse<Reservation>>(
            "reservations/",
            typeof locataireId === "number" ? { params: { locataire: locataireId } } : undefined
        );

        return filterForCurrentUser(normalizeList(response.data));
    } catch {
        const response = await api.get<Reservation[] | PaginatedResponse<Reservation>>("reservations/");
        return filterForCurrentUser(normalizeList(response.data));
    }
};

export const updateReservationStatus = async (
    reservationId: number,
    statut: Reservation["statut"]
) => {
    try {
        return await api.patch(`reservations/${reservationId}/`, { statut }, {
            headers: {
                "Content-Type": "application/json",
            },
        });
    } catch (error: any) {
        if (error?.response?.status !== 405) {
            throw error;
        }

        return api.put(`reservations/${reservationId}/`, { statut }, {
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
};

export const cancelReservation = async (reservationId: number) => {
    return updateReservationStatus(reservationId, "ANNULEE");
};

export const createReservationForUser = async (userId: number, payload: CreateReservationForUserPayload) => {
    const locataireId = await fetchLocataireProfileIdByUser(userId);

    if (!locataireId) {
        throw new Error("Profil locataire introuvable pour cet utilisateur.");
    }

    return createReservation({
        ...payload,
        locataire: locataireId,
    });
};
