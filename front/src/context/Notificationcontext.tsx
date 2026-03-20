import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useChat } from "./Chatcontext"
import { useLocation } from "react-router-dom"

interface Toast {
    id:       number
    title:    string
    body:     string
    avatar:   string
    convId:   number
}

interface NotifContextType {
    toasts: Toast[]
    dismiss: (id: number) => void
}

const NotifContext = createContext<NotifContextType>({ toasts: [], dismiss: () => {} })

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { conversations } = useChat()
    const location = useLocation()
    const [toasts, setToasts]   = useState<Toast[]>([])
    const [prevCounts, setPrev] = useState<Record<number, number>>({})

    useEffect(() => {
        conversations.forEach(conv => {
            const prev    = prevCounts[conv.id] ?? conv.unread_count
            const isOnMsg = location.pathname.includes("/messages")

            // Nouveau message ET on n'est pas déjà sur la page messages
            if (conv.unread_count > prev && !isOnMsg) {
                const lastMsg = conv.messages[conv.messages.length - 1]
                const toast: Toast = {
                    id:     Date.now() + conv.id,
                    title:  lastMsg?.sender_name ?? "New message",
                    body:   lastMsg?.text ?? "",
                    avatar: lastMsg?.sender_name?.charAt(0) ?? "?",
                    convId: conv.id,
                }
                setToasts(t => [...t, toast])
                // Auto-dismiss après 5s
                setTimeout(() => setToasts(t => t.filter(x => x.id !== toast.id)), 5000)
            }
        })

        // Mettre à jour les comptes précédents
        const newCounts: Record<number, number> = {}
        conversations.forEach(c => { newCounts[c.id] = c.unread_count })
        setPrev(newCounts)
    }, [conversations])

    const dismiss = (id: number) => setToasts(t => t.filter(x => x.id !== id))

    return (
        <NotifContext.Provider value={{ toasts, dismiss }}>
            {children}
        </NotifContext.Provider>
    )
}

export const useNotifications = () => useContext(NotifContext)