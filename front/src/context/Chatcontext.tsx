import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { useAuth } from "./AuthContext"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
const WS_URL   = (import.meta.env.VITE_WS_URL || "http://localhost:8001").replace("http", "ws")

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
    id:              number
    bien:            number
    property_name:   string
    property_img?:   string
    client:          number
    client_name:     string
    proprietaire:    number
    owner_name:      string
    last_message:    string
    last_message_at: string
    unread_count:    number
    messages:        Message[]
}

interface ChatContextType {
    conversations:    Conversation[]
    totalUnread:      number
    activeConv:       Conversation | null
    setActiveConv:    (c: Conversation | null) => void
    sendMessage:      (convId: number, text: string) => void
    markAsRead:       (convId: number) => void
    openConversation: (propertyId: number, ownerId: number) => Promise<void>
    loading:          boolean
    connected:        boolean
}

const ChatContext = createContext<ChatContextType | null>(null)

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth()

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConv,    setActiveConv]    = useState<Conversation | null>(null)
    const [loading,       setLoading]       = useState(true)
    const [connected,     setConnected]     = useState(false)

    const wsRef     = useRef<WebSocket | null>(null)
    const convWsRef = useRef<WebSocket | null>(null)

    const token = () => localStorage.getItem("access_token")

    const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0)

    // ── Reset complet quand l'user change (login/logout) ──
    useEffect(() => {
        // Fermer les WS existants
        wsRef.current?.close()
        convWsRef.current?.close()
        wsRef.current     = null
        convWsRef.current = null

        // Reset le state
        setConversations([])
        setActiveConv(null)
        setConnected(false)

        if (!user) {
            setLoading(false)
            return
        }

        // Charger les données du nouvel user
        fetchConversations()
        connectGlobalWS()

        return () => {
            wsRef.current?.close()
            convWsRef.current?.close()
        }
    }, [user?.id])

    // ── WS de conversation quand activeConv change ────────
    useEffect(() => {
        convWsRef.current?.close()
        if (!activeConv) return
        connectConvWS(activeConv.id)
        markAsRead(activeConv.id)
        return () => { convWsRef.current?.close() }
    }, [activeConv?.id])

    // ── Fetch conversations ───────────────────────────────
    const fetchConversations = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${BASE_URL}/api/chat/conversations/`, {
                headers: { Authorization: `Bearer ${token()}` }
            })
            if (!res.ok) throw new Error("Failed")
            const data = await res.json()
            const list = Array.isArray(data) ? data : data.results ?? []
            const withMessages = await Promise.all(list.map(async (conv: any) => {
                try {
                    const r = await fetch(`${BASE_URL}/api/chat/conversations/${conv.id}/`, {
                        headers: { Authorization: `Bearer ${token()}` }
                    })
                    const d = await r.json()
                    return { ...conv, messages: d.messages ?? [] }
                } catch {
                    return { ...conv, messages: [] }
                }
            }))
            setConversations(withMessages)
        } catch {
            setConversations([])
        } finally {
            setLoading(false)
        }
    }

    // ── WS global (notifications) ─────────────────────────
    const connectGlobalWS = () => {
        try {
            const t = token()
            if (!t) return
            const ws = new WebSocket(`${WS_URL}/ws/notifications/?token=${t}`)
            ws.onopen  = () => setConnected(true)
            ws.onclose = () => {
                setConnected(false)
                // Reconnecter seulement si le même user est encore connecté
                if (localStorage.getItem("access_token")) {
                    setTimeout(connectGlobalWS, 5000)
                }
            }
            ws.onerror = () => ws.close()
            ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data)
                    if (data.type === "new_message") {
                        handleIncomingMessage(data.conversation_id, data.message)
                    }
                } catch {}
            }
            wsRef.current = ws
        } catch {
            setConnected(false)
        }
    }

    // ── WS de conversation spécifique ─────────────────────
    const connectConvWS = (convId: number) => {
        try {
            const t = token()
            if (!t) return
            const ws = new WebSocket(`${WS_URL}/ws/chat/${convId}/?token=${t}`)
            ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data)
                    if (data.type === "new_message") {
                        const msg: Message = data.message
                        const myId = user ? parseInt((user as any).id) : -1
                        // Ignorer nos propres messages (déjà en optimistic)
                        if (msg.sender_id === myId) return
                        handleIncomingMessage(convId, msg)
                    }
                } catch {}
            }
            convWsRef.current = ws
        } catch {}
    }

    // ── Message entrant (de quelqu'un d'autre) ────────────
    const handleIncomingMessage = (convId: number, msg: Message) => {
        setConversations(prev => prev.map(c => {
            if (c.id !== convId) return c
            const alreadyExists = c.messages.some(m => m.id === msg.id)
            if (alreadyExists) return c
            return {
                ...c,
                messages:        [...(c.messages ?? []), msg],
                last_message:    msg.text,
                last_message_at: msg.created_at,
                unread_count:    c.unread_count + 1,
            }
        }))
        setActiveConv(prev => {
            if (!prev || prev.id !== convId) return prev
            const alreadyExists = prev.messages.some(m => m.id === msg.id)
            if (alreadyExists) return prev
            return {
                ...prev,
                messages:     [...(prev.messages ?? []), msg],
                unread_count: 0,
            }
        })
    }

    // ── Envoyer un message ────────────────────────────────
    const sendMessage = (convId: number, text: string) => {
        if (!text.trim()) return

        const tempId = -Date.now()
        const optimistic: Message = {
            id:          tempId,
            sender_id:   parseInt((user as any)!.id),
            sender_name: (user as any)!.fullName,
            text,
            created_at:  new Date().toISOString(),
            read:        true,
        }

        setConversations(prev => prev.map(c => {
            if (c.id !== convId) return c
            return {
                ...c,
                messages:        [...(c.messages ?? []), optimistic],
                last_message:    text,
                last_message_at: optimistic.created_at,
            }
        }))
        setActiveConv(prev => {
            if (!prev || prev.id !== convId) return prev
            return { ...prev, messages: [...(prev.messages ?? []), optimistic] }
        })

        if (convWsRef.current?.readyState === WebSocket.OPEN) {
            convWsRef.current.send(JSON.stringify({ type: "message", text }))
        } else {
            fetch(`${BASE_URL}/api/chat/conversations/${convId}/messages/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:  `Bearer ${token()}`
                },
                body: JSON.stringify({ text })
            }).catch(() => {})
        }
    }

    // ── Marquer comme lu ──────────────────────────────────
    const markAsRead = (convId: number) => {
        setConversations(prev => prev.map(c =>
            c.id === convId ? { ...c, unread_count: 0 } : c
        ))
        fetch(`${BASE_URL}/api/chat/conversations/${convId}/read/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token()}` }
        }).catch(() => {})
    }

    // ── Ouvrir/créer une conversation ─────────────────────
    const openConversation = async (propertyId: number, ownerId: number) => {
        const existing = conversations.find(c => c.bien === propertyId)
        if (existing) { setActiveConv(existing); return }

        try {
            const res = await fetch(`${BASE_URL}/api/chat/conversations/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:  `Bearer ${token()}`
                },
                body: JSON.stringify({ bien_id: propertyId, proprietaire_id: ownerId })
            })
            if (!res.ok) throw new Error("Failed to create conversation")
            const newConv = await res.json()
            const withMessages = { ...newConv, messages: [] }
            setConversations(prev => [withMessages, ...prev])
            setActiveConv(withMessages)
        } catch (err) {
            console.error("Failed to create conversation:", err)
            throw err
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