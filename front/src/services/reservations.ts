import api from "./api";

export type CreateReservationPayload = {
    bien: number;
    date_debut: string;
    date_fin: string;
    message?: string;
};

export const createReservation = async (payload: CreateReservationPayload) => {
    return api.post("reservations/", payload, {
        headers: {
            "Content-Type": "application/json",
        },
    });
};

