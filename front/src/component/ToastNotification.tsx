import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useNotifications } from "../context/Notificationcontext"

const ToastNotifications = () => {
    const { toasts, dismiss } = useNotifications()
    const { user }   = useAuth()
    const navigate   = useNavigate()

    if (toasts.length === 0) return null

    const msgPath = () => {
        if (user?.role === "owner") return "/dashboard/owner/messages"
        if (user?.role === "admin") return "/dashboard/admin/messages"
        return "/dashboard/client/messages"
    }

    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24,
            display: "flex", flexDirection: "column", gap: 10, zIndex: 9999,
        }}>
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    onClick={() => { navigate(msgPath()); dismiss(toast.id) }}
                    style={{
                        display: "flex", alignItems: "flex-start", gap: 12,
                        padding: "12px 14px", background: "#1a1814", color: "#fff",
                        borderRadius: 14, width: 300, cursor: "pointer",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                        animation: "toast-in .25s cubic-bezier(.2,.8,.3,1)",
                    }}
                >
                    <div style={{
                        width: 36, height: 36, borderRadius: "50%", background: "#b8922a",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 14, flexShrink: 0,
                    }}>
                        {toast.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{toast.title}</div>
                        <div style={{ fontSize: 12, opacity: .7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {toast.body}
                        </div>
                    </div>
                    <button
                        onClick={e => { e.stopPropagation(); dismiss(toast.id) }}
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", padding: 0, fontSize: 18, lineHeight: 1 }}
                    >×</button>
                </div>
            ))}
            <style>{`@keyframes toast-in { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }`}</style>
        </div>
    )
}

export default ToastNotifications