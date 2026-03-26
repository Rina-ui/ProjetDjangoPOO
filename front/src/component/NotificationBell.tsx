// src/components/NotificationBell.tsx
import { useState, useRef, useEffect } from "react"
import { usePayments, type Notif } from "../context/PaymentContext"

const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return "À l'instant"
    if (m < 60) return `Il y a ${m}min`
    const h = Math.floor(m / 60)
    if (h < 24) return `Il y a ${h}h`
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

const iconFor = (type: Notif["type"]) => {
    if (type === "payment_received") return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    )
    if (type === "commission") return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2.2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
    )
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
    )
}

const bgFor = (type: Notif["type"]) => ({
    payment_received: "#f0fdf4",
    commission:       "#faf5e8",
    payment_due:      "#fef2f2",
}[type] ?? "#f5f4f0")

export const NotificationBell = () => {
    const { notifs, unread, markRead, markAllRead } = usePayments()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
        document.addEventListener("mousedown", h)
        return () => document.removeEventListener("mousedown", h)
    }, [])

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <button onClick={() => setOpen(o => !o)} style={{
                position: "relative", background: open ? "var(--bg2)" : "transparent",
                border: "1.5px solid var(--border)", borderRadius: 10,
                width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "background .15s",
            }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                {unread > 0 && (
                    <span style={{
                        position: "absolute", top: -5, right: -5,
                        background: "#c0392b", color: "#fff",
                        fontSize: 10, fontWeight: 800,
                        width: 18, height: 18, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "2px solid #fff",
                        animation: "bell-pop .3s cubic-bezier(.34,1.56,.64,1)",
                    }}>
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    width: 340, background: "#fff", border: "1px solid var(--border)",
                    borderRadius: 16, boxShadow: "0 12px 36px rgba(0,0,0,.14)",
                    zIndex: 999, overflow: "hidden",
                    animation: "bell-drop .2s ease",
                }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dark)" }}>
                            Notifications
                            {unread > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: "#fef2f2", color: "#c0392b", padding: "1px 7px", borderRadius: 20, fontWeight: 700 }}>{unread}</span>}
                        </span>
                        {unread > 0 && (
                            <button onClick={markAllRead} style={{ fontSize: 11, color: "var(--text3)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                                Tout lire
                            </button>
                        )}
                    </div>
                    <div style={{ maxHeight: 360, overflowY: "auto" }}>
                        {notifs.length === 0 ? (
                            <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
                                Aucune notification
                            </div>
                        ) : notifs.slice(0, 12).map(n => (
                            <div key={n.id} onClick={() => markRead(n.id)} style={{
                                display: "flex", gap: 10, padding: "11px 16px",
                                borderBottom: "1px solid var(--border)",
                                background: n.read ? "transparent" : "#fafaf7",
                                cursor: "pointer", transition: "background .15s",
                            }}>
                                <div style={{ width: 30, height: 30, borderRadius: "50%", background: bgFor(n.type), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {iconFor(n.type)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                                        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--dark)", lineHeight: 1.3 }}>{n.title}</span>
                                        {!n.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#b8922a", flexShrink: 0, marginTop: 3 }}/>}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                                    {n.amount != null && (
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d", marginTop: 3 }}>{n.amount.toLocaleString()} XOF</div>
                                    )}
                                    <div style={{ fontSize: 10.5, color: "var(--text3)", marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes bell-pop  { from{transform:scale(.4)} to{transform:scale(1)} }
                @keyframes bell-drop { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
            `}</style>
        </div>
    )
}

export default NotificationBell