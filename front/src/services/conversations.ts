import api from "./api";
import { fetchLocataireProfileIdByUser } from "./reservations";

type PaginatedResponse<T> = {
    results?: T[];
};

export type Conversation = {
    id: number;
    property_id?: number;
    owner_id?: number;
    locataire_id?: number;
    bien?: number | { id?: number };
    proprietaire?: number | { id?: number; utilisateur?: number | { id?: number } };
    locataire?: number | { id?: number; utilisateur?: number | { id?: number } };
};

export type ConversationMessage = {
    id: number;
    text: string;
    texte?: string;
    contenu?: string;
    message?: string;
    content?: string;
    body?: string;
    created_at?: string;
    date_envoi?: string;
    sender?: number | { id?: number; username?: string; email?: string; first_name?: string; last_name?: string };
    expediteur?: number;
    sender_name?: string;
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

const extractConversationId = (data: any): number | null => {
    if (data && typeof data === "object" && typeof data.id === "number") {
        return data.id;
    }

    if (Array.isArray(data) && data[0] && typeof data[0].id === "number") {
        return data[0].id;
    }

    if (data?.conversation && typeof data.conversation.id === "number") {
        return data.conversation.id;
    }

    return null;
};

const extractConversationPropertyId = (item: Conversation): number | null => {
    if (typeof item.property_id === "number") {
        return item.property_id;
    }

    if (typeof item.bien === "number") {
        return item.bien;
    }

    if (item.bien && typeof item.bien === "object" && typeof item.bien.id === "number") {
        return item.bien.id;
    }

    return null;
};

const extractConversationOwnerId = (item: Conversation): number | null => {
    if (typeof item.owner_id === "number") {
        return item.owner_id;
    }

    if (typeof item.proprietaire === "number") {
        return item.proprietaire;
    }

    if (item.proprietaire && typeof item.proprietaire === "object") {
        const utilisateur = item.proprietaire.utilisateur;
        if (typeof utilisateur === "number") {
            return utilisateur;
        }

        if (utilisateur && typeof utilisateur === "object" && typeof utilisateur.id === "number") {
            return utilisateur.id;
        }

        if (typeof item.proprietaire.id === "number") {
            return item.proprietaire.id;
        }
    }

    return null;
};

const extractConversationLocataireId = (item: Conversation): number | null => {
    if (typeof item.locataire_id === "number") {
        return item.locataire_id;
    }

    if (typeof item.locataire === "number") {
        return item.locataire;
    }

    if (item.locataire && typeof item.locataire === "object" && typeof item.locataire.id === "number") {
        return item.locataire.id;
    }

    return null;
};

export const listConversations = async (params?: { property_id?: number; owner_id?: number; locataire_id?: number }): Promise<Conversation[]> => {
    try {
        const response = await api.get<Conversation[] | PaginatedResponse<Conversation>>("conversations", {
            params,
        });

        return normalizeList(response.data);
    } catch (error: any) {
        if (error?.response?.status !== 404 && error?.response?.status !== 301 && error?.response?.status !== 308) {
            throw error;
        }

        const fallback = await api.get<Conversation[] | PaginatedResponse<Conversation>>("conversations/", {
            params,
        });

        return normalizeList(fallback.data);
    }
};

type EnsureConversationParams = {
    propertyId: number;
    ownerId: number;
    userId: number;
};

export const startConversation = async (
    { propertyId, ownerId }: EnsureConversationParams,
    locataireId: number
): Promise<Conversation> => {

    const response = await api.post("conversations/", {
        property_id: propertyId,
        owner_id: ownerId,
        locataire_id: locataireId,
    }, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    const id = extractConversationId(response.data);
    if (!id) {
        throw new Error("Conversation creee mais id introuvable.");
    }

    return {
        id,
        property_id: propertyId,
        owner_id: ownerId,
        locataire_id: locataireId,
    };
};

export const ensureConversationForProperty = async ({ propertyId, ownerId, userId }: EnsureConversationParams): Promise<Conversation> => {
    const locataireId = await fetchLocataireProfileIdByUser(userId);
    if (!locataireId) {
        throw new Error("Profil locataire introuvable pour l'utilisateur connecte.");
    }

    try {
        const convs = await listConversations({
            property_id: propertyId,
            owner_id: ownerId,
            locataire_id: locataireId,
        });
        const found = convs.find((item) => {
            const pId = extractConversationPropertyId(item);
            const oId = extractConversationOwnerId(item);
            const lId = extractConversationLocataireId(item);
            return pId === propertyId && oId === ownerId && lId === locataireId;
        });

        if (found) {
            return found;
        }
    } catch {
        // Fallback create ci-dessous.
    }

    return startConversation({ propertyId, ownerId, userId }, locataireId);
};

const toMessageText = (item: any): string => {
    const candidates = [item?.text, item?.texte, item?.contenu, item?.message, item?.content, item?.body];
    const found = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
    return (found as string | undefined) || "";
};

const normalizeMessages = (data: ConversationMessage[] | PaginatedResponse<ConversationMessage>): ConversationMessage[] => {
    return normalizeList(data).map((item: any) => ({
        ...item,
        text: toMessageText(item),
        created_at: item?.created_at || item?.date_envoi,
        sender: item?.sender ?? item?.expediteur,
    }));
};

export const fetchConversationMessages = async (conversationId: number): Promise<ConversationMessage[]> => {
    const response = await api.get<ConversationMessage[] | PaginatedResponse<ConversationMessage>>(
        `conversations/${conversationId}/messages/`
    );

    return normalizeMessages(response.data);
};

export const sendConversationMessage = async (
    conversationId: number,
    text: string,
    expediteurId: number
): Promise<ConversationMessage> => {
    const response = await api.post(
        `conversations/${conversationId}/messages/`,
        {
            text,
            expediteur_id: expediteurId,
            sender_id: expediteurId,
        },
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    const payload = response.data as any;
    return {
        ...payload,
        text: toMessageText(payload),
        created_at: payload?.created_at || payload?.date_envoi,
        sender: payload?.sender ?? payload?.expediteur,
    } as ConversationMessage;
};

