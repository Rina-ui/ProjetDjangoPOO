import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export const DEFAULT_COMMISSION = 0.10

export const calcSplit = (montant: number, taux?: number) => {
    const t = taux ?? DEFAULT_COMMISSION
    const agence  = Math.round(montant * t)
    const proprio = montant - agence
    return { agence, proprio, taux: t }
}

export interface Payment {
    id:               string
    montant:          number
    montant_proprio:  number
    montant_agence:   number
    taux_commission:  number
    description:      string
    statut:           "SUCCESS" | "PENDING" | "FAILED"
    reference:        string
    bien_adresse:     string
    bien_id?:         number
    locataire_nom:    string
    proprietaire_nom: string
    created_at:       string
    mois?:            string
}

export interface Notif {
    id:         string
    type:       "payment_received" | "commission" | "payment_due"
    title:      string
    body:       string
    amount?:    number
    read:       boolean
    created_at: string
}

interface Ctx {
    payments:      Payment[]
    notifs:        Notif[]
    unread:        number
    loading:       boolean
    refresh:       () => void
    markRead:      (id: string) => void
    markAllRead:   () => void
    addPayment:    (p: Omit<Payment, "id" | "created_at">) => Promise<void>
}

const PaymentCtx = createContext<Ctx | null>(null)

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
    const [payments, setPayments] = useState<Payment[]>([])
    const [notifs,   setNotifs]   = useState<Notif[]>([])
    const [loading,  setLoading]  = useState(false)

    const getToken = () => localStorage.getItem("access_token") ?? ""

    const refresh = useCallback(async () => {
        setLoading(true)
        try {
            const h = { Authorization: `Bearer ${getToken()}` }
            const [pr, nr] = await Promise.all([
                fetch(`${BASE_URL}/api/paiements/`,     { headers: h }),
                fetch(`${BASE_URL}/api/notifications/`, { headers: h }),
            ])
            if (pr.ok) { const d = await pr.json(); setPayments(Array.isArray(d) ? d : d.results ?? []) }
            if (nr.ok) { const d = await nr.json(); setNotifs(Array.isArray(d) ? d : d.results ?? []) }
        } catch { /* API not ready yet */ }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { refresh() }, [refresh])

    const addPayment = async (p: Omit<Payment, "id" | "created_at">) => {
        // Envoyer au backend (best-effort)
        fetch(`${BASE_URL}/api/paiements/enregistrer/`, {
            method:  "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
            body:    JSON.stringify(p),
        }).catch(() => {})

        // Optimistic
        const newP: Payment = { ...p, id: `loc-${Date.now()}`, created_at: new Date().toISOString() }
        setPayments(prev => [newP, ...prev])

        const pct = `${Math.round(p.taux_commission * 100)}%`
        const now = new Date().toISOString()
        setNotifs(prev => [
            { id: `n-${Date.now()}-1`, type: "payment_received", read: false, created_at: now,
                amount: p.montant,
                title: "Paiement reçu",
                body:  `${p.locataire_nom} · ${p.montant.toLocaleString()} XOF · ${p.bien_adresse}` },
            { id: `n-${Date.now()}-2`, type: "commission", read: false, created_at: now,
                amount: p.montant_agence,
                title: `Commission agence (${pct})`,
                body:  `${p.montant_agence.toLocaleString()} XOF reversés à l'agence KÔRÂ` },
            ...prev,
        ])
    }

    const markRead    = (id: string) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n))
    const markAllRead = ()           => setNotifs(p => p.map(n => ({ ...n, read: true })))
    const unread      = notifs.filter(n => !n.read).length

    return (
        <PaymentCtx.Provider value={{ payments, notifs, unread, loading, refresh, markRead, markAllRead, addPayment }}>
            {children}
        </PaymentCtx.Provider>
    )
}

export const usePayments = () => {
    const c = useContext(PaymentCtx)
    if (!c) throw new Error("usePayments must be inside PaymentProvider")
    return c
}