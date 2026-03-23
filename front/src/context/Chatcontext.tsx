import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { useAuth } from "./AuthContext"

// ── TYPES ─────────────────────────────────────────────────
export interface Message {
    id:          number
    sender_id:   number
    sender_name: string
    text:        string
    created_at:  string
    read:        boolean
}

export interface Conversation {
    id:            number
    property_id:   number
    property_name: string
    property_img?: string
    client_id:     number
    client_name:   string
    owner_id:      number
    owner_name:    string
    last_message:  string
    last_message_at: string
    unread_count:  number
    messages:      Message[]
}

interface ChatContextType {
    conversations:    Conversation[]
    totalUnread:      number
    activeConv:       Conversation | null
    setActiveConv:    (c: Conversation | null) => void
    sendMessage:      (convId: number, text: string) => void
    markAsRead:       (convId: number) => void
    openConversation: (propertyId: number, ownerId: number) => void
    loading:          boolean
    connected:        boolean
}

const ChatContext = createContext<ChatContextType | null>(null)

// ── PROVIDER ──────────────────────────────────────────────
export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth()

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConv,    setActiveConv]    = useState<Conversation | null>(null)
    const [loading,       setLoading]       = useState(true)
    const [connected,     setConnected]     = useState(false)

    // WebSocket ref — persiste entre les renders
    const wsRef    = useRef<WebSocket | null>(null)
    const convWsRef = useRef<WebSocket | null>(null)

    // ── Calcul des non-lus ────────────────────────────────
    const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0)

    // ── Charger les conversations au mount ────────────────
    useEffect(() => {
        if (!user) return
        fetchConversations()
        connectGlobalWS()
        return () => { wsRef.current?.close() }
    }, [user])

    // ── Ouvrir WS de conversation quand activeConv change ─
    useEffect(() => {
        convWsRef.current?.close()
        if (!activeConv) return
        connectConvWS(activeConv.id)
        markAsRead(activeConv.id)
        return () => { convWsRef.current?.close() }
    }, [activeConv?.id])

    // ── Fetch conversations depuis l'API REST ─────────────
    const fetchConversations = async () => {
        setLoading(true)
        try {
            // TODO: ajuster l'URL selon ton backend Django
            const res = await fetch("/api/chat/conversations/", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
            const data = await res.json()
            setConversations(data)
        } catch (err) {
            console.error("Failed to load conversations:", err)
            // Données de démo — supprimer quand l'API est branchée
            setConversations(DEMO_CONVERSATIONS)
        } finally {
            setLoading(false)
        }
    }

    // ── WebSocket global (notifications seulement) ────────
    const connectGlobalWS = () => {
        // TODO: remplacer par l'URL de ton serveur Django Channels
        const wsUrl = `ws://${window.location.host}/ws/chat/`
        const ws = new WebSocket(wsUrl)

        ws.onopen  = () => setConnected(true)
        ws.onclose = () => { setConnected(false); setTimeout(connectGlobalWS, 3000) }
        ws.onerror = () => ws.close()

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data)
            if (data.type === "new_message") {
                handleNewMessage(data.conversation_id, data.message)
            }
        }
        wsRef.current = ws
    }

    // ── WebSocket de conversation (messages temps réel) ───
    const connectConvWS = (convId: number) => {
        // TODO: remplacer par l'URL de ton serveur Django Channels
        const wsUrl = `ws://${window.location.host}/ws/chat/${convId}/`
        const ws = new WebSocket(wsUrl)

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data)
            if (data.type === "new_message") {
                handleNewMessage(convId, data.message)
            }
        }
        convWsRef.current = ws
    }

    // ── Réception d'un message ────────────────────────────
    const handleNewMessage = (convId: number, msg: Message) => {
        setConversations(prev => prev.map(c => {
            if (c.id !== convId) return c
            const isActive = activeConv?.id === convId
            return {
                ...c,
                messages:       [...c.messages, msg],
                last_message:   msg.text,
                last_message_at: msg.created_at,
                unread_count:   isActive ? 0 : c.unread_count + 1,
            }
        }))
        // Mettre à jour activeConv si c'est la conv ouverte
        setActiveConv(prev => {
            if (!prev || prev.id !== convId) return prev
            return { ...prev, messages: [...prev.messages, msg] }
        })
    }

    // ── Envoyer un message ────────────────────────────────
    const sendMessage = (convId: number, text: string) => {
        if (!text.trim()) return

        // Envoyer via WebSocket si connecté, sinon via REST
        if (convWsRef.current?.readyState === WebSocket.OPEN) {
            convWsRef.current.send(JSON.stringify({ type: "message", text }))
        } else {
            // Fallback REST
            // TODO: POST /api/chat/conversations/{convId}/messages/
            fetch(`/api/chat/conversations/${convId}/messages/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ text })
            })
        }

        // Optimistic update — affiche le message immédiatement
        const optimistic: Message = {
            id:          Date.now(),
            sender_id:   user!.id as unknown as number,
            sender_name: user!.fullName,
            text,
            created_at:  new Date().toISOString(),
            read:        true,
        }
        handleNewMessage(convId, optimistic)
    }

    // ── Marquer comme lu ──────────────────────────────────
    const markAsRead = (convId: number) => {
        setConversations(prev => prev.map(c =>
            c.id === convId ? { ...c, unread_count: 0 } : c
        ))
        // TODO: POST /api/chat/conversations/{convId}/read/
        fetch(`/api/chat/conversations/${convId}/read/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }).catch(() => {})
    }

    // ── Ouvrir/créer une conversation ─────────────────────
    const openConversation = async (propertyId: number, ownerId: number) => {
        // Cherche si la conv existe déjà
        const existing = conversations.find(c => c.property_id === propertyId)
        if (existing) { setActiveConv(existing); return }

        // TODO: POST /api/chat/conversations/
        try {
            const res = await fetch("http://localhost:8000/api/chat/conversations/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ property_id: propertyId, owner_id: ownerId })
            })
            const newConv = await res.json()
            setConversations(prev => [newConv, ...prev])
            setActiveConv(newConv)
        } catch (err) {
            console.error("Failed to create conversation:", err)
        }
    }

    return (
        <ChatContext.Provider value={{
            conversations, totalUnread, activeConv, setActiveConv,
            sendMessage, markAsRead, openConversation, loading, connected
        }}>
            {children}
        </ChatContext.Provider>
    )
}

export const useChat = () => {
    const ctx = useContext(ChatContext)
    if (!ctx) throw new Error("useChat must be used inside ChatProvider")
    return ctx
}

// ── DEMO DATA (supprimer quand l'API est branchée) ────────
const DEMO_CONVERSATIONS: Conversation[] = [
    {
        id: 1, property_id: 1, property_name: "Villa Anfa",
        property_img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&q=60",
        client_id: 3, client_name: "Amina Touré",
        owner_id: 2, owner_name: "Brandon Levin",
        last_message: "Is the price negotiable?",
        last_message_at: new Date(Date.now() - 3600000).toISOString(),
        unread_count: 2,
        messages: [
            { id: 1, sender_id: 3, sender_name: "Amina Touré",  text: "Hello, I'm interested in this property.", created_at: new Date(Date.now() - 7200000).toISOString(), read: true },
            { id: 2, sender_id: 2, sender_name: "Brandon Levin", text: "Hi! Happy to answer any questions.", created_at: new Date(Date.now() - 5400000).toISOString(), read: true },
            { id: 3, sender_id: 3, sender_name: "Amina Touré",  text: "Is the price negotiable?", created_at: new Date(Date.now() - 3600000).toISOString(), read: false },
        ]
    },
    {
        id: 2, property_id: 2, property_name: "Appartement Guéliz",
        property_img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&q=60",
        client_id: 4, client_name: "James W.",
        owner_id: 2, owner_name: "Gustavo Calzoni",
        last_message: "When can I visit?",
        last_message_at: new Date(Date.now() - 86400000).toISOString(),
        unread_count: 0,
        messages: [
            { id: 4, sender_id: 4, sender_name: "James W.", text: "When can I visit?", created_at: new Date(Date.now() - 86400000).toISOString(), read: true },
        ]
    },
]