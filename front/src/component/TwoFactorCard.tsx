import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const TwoFactorCard = () => {
    const navigate = useNavigate()
    const [enabled, setEnabled] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState("")

    const token = localStorage.getItem("access_token")

    const loadStatus = async () => {
        if (!token) {
            setEnabled(false)
            return
        }
        try {
            const res = await fetch(`${BASE_URL}/api/auth/me/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!res.ok) {
                setEnabled(false)
                return
            }
            const data = await res.json()
            setEnabled(Boolean(data?.totp_enabled))
        } catch {
            setEnabled(false)
        }
    }

    useEffect(() => {
        loadStatus()
    }, [])

    const disable2FA = async () => {
        const code = window.prompt("Entrez votre code OTP actuel pour desactiver la 2FA")?.trim()
        if (!code) return

        setLoading(true)
        setMsg("")
        try {
            const res = await fetch(`${BASE_URL}/api/auth/2fa/disable/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ code, otp: code }),
            })

            if (!res.ok) {
                const err = await res.json().catch(() => null)
                setMsg(err?.detail || err?.message || "Impossible de desactiver la 2FA")
                return
            }

            setEnabled(false)
            setMsg("2FA desactivee")
        } catch {
            setMsg("Erreur reseau")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="card" style={{ marginTop: 18 }}>
            <div className="card-hd">
                <div className="card-title">Two-Factor Authentication (OTP)</div>
            </div>

            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
                Securisez votre compte avec Google Authenticator (code TOTP a 6 chiffres).
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>Statut:</span>
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 20,
                        padding: "3px 10px",
                        background: enabled ? "var(--green-bg)" : "var(--red-bg)",
                        color: enabled ? "var(--green)" : "var(--red)",
                    }}
                >
                    {enabled ? "Active" : "Inactive"}
                </span>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {!enabled ? (
                    <button className="btn-primary" onClick={() => navigate("/2fa/setup")} disabled={loading || enabled === null}>
                        Activer OTP
                    </button>
                ) : (
                    <button
                        className="btn-ghost"
                        onClick={disable2FA}
                        disabled={loading}
                        style={{ color: "var(--red)", borderColor: "var(--red)" }}
                    >
                        {loading ? "Desactivation..." : "Desactiver OTP"}
                    </button>
                )}

                <button className="btn-ghost" onClick={loadStatus} disabled={loading}>
                    Rafraichir
                </button>
            </div>

            {msg && (
                <div style={{ marginTop: 10, fontSize: 12, color: msg.toLowerCase().includes("active") ? "var(--green)" : "var(--red)" }}>
                    {msg}
                </div>
            )}
        </div>
    )
}

export default TwoFactorCard

