import { useState, useRef, useEffect } from "react"
import DashboardLayout from "../../../component/sidebar"
import { useAuth } from "../../../context/AuthContext"
import { useChat } from "../../../context/Chatcontext"
import "../../../style/dashboard.css"
import "../../../style/message.css"

const NAV_ITEMS = [
    { label: "Overview",      path: "/dashboard/owner" },
    { label: "My Properties", path: "/dashboard/owner/properties" },
    { label: "Analytics",     path: "/dashboard/owner/analytics" },
    { label: "Messages",      path: "/dashboard/owner/messages" },
    { label: "Settings",      path: "/dashboard/owner/settings" },
]

const OwnerMessages = () => {
    const { user } = useAuth()
    const { conversations, activeConv, setActiveConv, sendMessage, totalUnread, loading, connected } = useChat()

    const [text,   setText]   = useState("")
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState<"all" | "unread">("all")
    const bottomRef = useRef<HTMLDivElement>(null)

    const myId = parseInt(user?.id ?? "0")

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [activeConv?.messages.length])

    const handleSend = () => {
        if (!text.trim() || !activeConv) return
        sendMessage(activeConv.id, text.trim())
        setText("")
    }

    const formatTime = (iso: string) => {
        const d = new Date(iso)
        const diffH = (Date.now() - d.getTime()) / 3600000
        if (diffH < 24) return d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })
        return d.toLocaleDateString("en", { month: "short", day: "numeric" })
    }

    const filtered = conversations
        .filter(c => filter === "all" || c.unread_count > 0)
        .filter(c =>
            c.client_name.toLowerCase().includes(search.toLowerCase()) ||
            c.property_name.toLowerCase().includes(search.toLowerCase())
        )

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Messages">
            <div className="msg-layout">

                {/* ── SIDEBAR ─────────────────────────────── */}
                <div className="msg-sidebar">
                    <div className="msg-sidebar-header">
                        <div className="msg-sidebar-title">
                            Inquiries
                            {totalUnread > 0 && <span className="msg-unread-badge">{totalUnread}</span>}
                        </div>
                        <div className="msg-search">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
                            <input placeholder="Search clients, properties…" value={search} onChange={e => setSearch(e.target.value)}/>
                        </div>
                        <div className="msg-filter-row">
                            {(["all", "unread"] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`msg-filter-btn ${filter === f ? "msg-filter-btn--active" : ""}`}
                                >
                                    {f === "all" ? "All" : "Unread"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="msg-conv-list">
                        {loading && <div style={{ padding: 20, color: "var(--text3)", fontSize: 13 }}>Loading…</div>}
                        {!loading && filtered.length === 0 && (
                            <div style={{ padding: 20, color: "var(--text3)", fontSize: 13 }}>No inquiries yet</div>
                        )}
                        {filtered.map(conv => (
                            <div
                                key={conv.id}
                                className={`msg-conv-item ${activeConv?.id === conv.id ? "msg-conv-item--active" : ""} ${conv.unread_count > 0 ? "msg-conv-item--unread" : ""}`}
                                onClick={() => setActiveConv(conv)}
                            >
                                <div className="msg-conv-avatar">{conv.client_name.charAt(0)}</div>
                                <div className="msg-conv-body">
                                    <div className="msg-conv-prop">{conv.property_name}</div>
                                    <div className="msg-conv-name">{conv.client_name}</div>
                                    <div className={`msg-conv-preview ${conv.unread_count > 0 ? "msg-conv-preview--unread" : ""}`}>
                                        {conv.last_message}
                                    </div>
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
                            <div className="msg-conv-avatar" style={{ width: 38, height: 38 }}>
                                {activeConv.client_name.charAt(0)}
                            </div>
                            <div className="msg-chat-header-info">
                                <div className="msg-chat-header-name">{activeConv.client_name}</div>
                                <div className="msg-chat-header-sub">Inquiry about {activeConv.property_name}</div>
                            </div>
                            <div className="msg-chat-status">
                                <span className={`msg-status-dot ${connected ? "msg-status-dot--online" : ""}`}/>
                                {connected ? "Live" : "Offline"}
                            </div>
                        </div>

                        <div className="msg-prop-chip">
                            {activeConv.property_img && <img src={activeConv.property_img} alt=""/>}
                            <div>
                                <div className="msg-prop-chip-name">{activeConv.property_name}</div>
                                <div className="msg-prop-chip-sub">Price inquiry</div>
                            </div>
                        </div>

                        <div className="msg-messages">
                            {activeConv.messages.map(msg => {
                                const isMe = msg.sender_id === myId
                                return (
                                    <div key={msg.id} className={`msg-bubble-wrap ${isMe ? "msg-bubble-wrap--me" : ""}`}>
                                        {!isMe && <div className="msg-bubble-avatar">{msg.sender_name.charAt(0)}</div>}
                                        <div className={`msg-bubble ${isMe ? "msg-bubble--me" : ""}`}>{msg.text}</div>
                                        <span className="msg-bubble-time">{formatTime(msg.created_at)}</span>
                                    </div>
                                )
                            })}
                            <div ref={bottomRef}/>
                        </div>

                        <div className="msg-input-wrap">
                            <textarea
                                className="msg-input"
                                placeholder="Reply to this inquiry…"
                                value={text}
                                rows={1}
                                onChange={e => setText(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                            />
                            <button className="msg-send-btn" onClick={handleSend} disabled={!text.trim()}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                                </svg>
                            </button>
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
                            <div className="msg-empty-title">Client inquiries</div>
                            <div className="msg-empty-sub">Select a conversation to respond to a client</div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

export default OwnerMessages