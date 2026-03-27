import { useState } from "react"
import DashboardLayout from "../../../component/sidebar"
import { useChat } from "../../../context/Chatcontext"
import "../../../style/dashboard.css"
import "../../../style/message.css"

const NAV_ITEMS = [
    { label: "Dashboard",    path: "/dashboard/admin" },
    { label: "Leads",        path: "/dashboard/admin/leads" },
    { label: "Properties",   path: "/dashboard/admin/properties" },
    { label: "Transactions", path: "/dashboard/admin/transactions" },
    { label: "Calendar",     path: "/dashboard/admin/calendar" },
    { label: "Settings",     path: "/dashboard/admin/settings" },
]

const AdminMessages = () => {
    const { conversations, activeConv, setActiveConv, totalUnread, loading } = useChat()

    const [search,     setSearch]     = useState("")
    const [filterProp, setFilterProp] = useState("all")

    const formatTime = (iso: string) => {
        const d = new Date(iso)
        const diffH = (Date.now() - d.getTime()) / 3600000
        if (diffH < 24) return d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })
        return d.toLocaleDateString("en", { month: "short", day: "numeric" })
    }

    // Liste des propriétés uniques pour le filtre
    const properties = ["all", ...Array.from(new Set(conversations.map(c => c.property_name)))]

    const filtered = conversations
        .filter(c => filterProp === "all" || c.property_name === filterProp)
        .filter(c =>
            c.client_name.toLowerCase().includes(search.toLowerCase()) ||
            c.owner_name.toLowerCase().includes(search.toLowerCase()) ||
            c.property_name.toLowerCase().includes(search.toLowerCase())
        )

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="All Conversations">
            <div className="msg-layout">

                {/* ── SIDEBAR ─────────────────────────────── */}
                <div className="msg-sidebar">
                    <div className="msg-sidebar-header">
                        <div className="msg-sidebar-title">
                            All threads
                            <span className="msg-unread-badge msg-unread-badge--muted">
                                {conversations.length}
                            </span>
                            {totalUnread > 0 && <span className="msg-unread-badge">{totalUnread} new</span>}
                        </div>
                        <div className="msg-search">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
                            <input placeholder="Search users, properties…" value={search} onChange={e => setSearch(e.target.value)}/>
                        </div>
                        {/* Filter by property */}
                        <select value={filterProp} onChange={e => setFilterProp(e.target.value)} className="msg-filter-select">
                            {properties.map(p => (
                                <option key={p} value={p}>{p === "all" ? "All properties" : p}</option>
                            ))}
                        </select>
                    </div>

                    <div className="msg-conv-list">
                        {loading && <div style={{ padding: 20, color: "var(--text3)", fontSize: 13 }}>Loading…</div>}
                        {filtered.map(conv => (
                            <div
                                key={conv.id}
                                className={`msg-conv-item ${activeConv?.id === conv.id ? "msg-conv-item--active" : ""} ${conv.unread_count > 0 ? "msg-conv-item--unread" : ""}`}
                                onClick={() => setActiveConv(conv)}
                            >
                                <div className="msg-conv-avatar">{conv.client_name.charAt(0)}</div>
                                <div className="msg-conv-body">
                                    <div className="msg-conv-prop">{conv.property_name}</div>
                                    <div className="msg-conv-name" style={{ fontSize: 12 }}>
                                        {conv.client_name} → {conv.owner_name}
                                    </div>
                                    <div className="msg-conv-preview">{conv.last_message}</div>
                                </div>
                                <div className="msg-conv-meta">
                                    <span className="msg-conv-time">{formatTime(conv.last_message_at)}</span>
                                    {conv.unread_count > 0 && <span className="msg-conv-dot"/>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── CHAT ────────────────────────────────── */}
                {activeConv ? (
                    <div className="msg-chat">
                        <div className="msg-chat-header">
                            <div style={{ flex: 1 }}>
                                <div className="msg-chat-header-name">
                                    {activeConv.client_name} ↔ {activeConv.owner_name}
                                </div>
                                <div className="msg-chat-header-sub">{activeConv.property_name} · {activeConv.messages.length} messages</div>
                            </div>
                            {/* Admin badge */}
                            <span className="msg-admin-readonly">
                                Read-only
                            </span>
                        </div>

                        <div className="msg-prop-chip">
                            {activeConv.property_img && <img src={activeConv.property_img} alt=""/>}
                            <div>
                                <div className="msg-prop-chip-name">{activeConv.property_name}</div>
                                <div className="msg-prop-chip-sub">{activeConv.messages.length} messages · Started {formatTime(activeConv.messages[0]?.created_at)}</div>
                            </div>
                        </div>

                        <div className="msg-messages">
                            {activeConv.messages.map(msg => {
                                const isOwner = msg.sender_id === activeConv.proprietaire
                                return (
                                    <div key={msg.id} className={`msg-bubble-wrap ${isOwner ? "msg-bubble-wrap--me" : ""}`}>
                                        {!isOwner && <div className="msg-bubble-avatar">{msg.sender_name.charAt(0)}</div>}
                                        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: isOwner ? "flex-end" : "flex-start" }}>
                                            <span style={{ fontSize: 10, color: "var(--text3)", padding: "0 4px" }}>{msg.sender_name}</span>
                                            <div className={`msg-bubble ${isOwner ? "msg-bubble--me" : ""}`}>{msg.text}</div>
                                        </div>
                                        <span className="msg-bubble-time">{formatTime(msg.created_at)}</span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Admin ne peut pas écrire */}
                        <div className="msg-admin-label">
                            You are viewing this conversation as administrator — read only
                        </div>
                    </div>
                ) : (
                    <div className="msg-chat">
                        <div className="msg-empty">
                            <div className="msg-empty-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5">
                                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                                </svg>
                            </div>
                            <div className="msg-empty-title">Platform conversations</div>
                            <div className="msg-empty-sub">Select a thread to read the full exchange between a client and an owner</div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

export default AdminMessages