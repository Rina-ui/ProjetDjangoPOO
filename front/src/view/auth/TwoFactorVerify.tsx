import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import "../../style/auth.css"
import "../../style/twofa.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const TwoFactorVerify = () => {
    const navigate = useNavigate()
    const { completeLogin } = useAuth()

    const [code,    setCode]    = useState("")
    const [error,   setError]   = useState("")
    const [loading, setLoading] = useState(false)
    const [done,    setDone]    = useState(false)

    const handleSubmit = async () => {
        if (code.length !== 6) { setError("Code must be 6 digits"); return }
        setLoading(true); setError("")
        try {
            const username = sessionStorage.getItem("pending_2fa_user")
            const challenge = sessionStorage.getItem("pending_2fa_challenge")
            if (!username && !challenge) {
                setError("Session OTP expirée. Reconnectez-vous.")
                setTimeout(() => navigate("/login"), 600)
                return
            }

            const payload: Record<string, string> = { code, otp: code }
            if (challenge) {
                payload.challenge_token = challenge
            } else if (username) {
                payload.username = username
            }

            const res = await fetch(`${BASE_URL}/api/auth/2fa/login/`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            if (!res.ok) {
                const err = await res.json().catch(() => null)
                setError(err?.detail || err?.message || "Invalid code. Check Google Authenticator.")
                return
            }

            const data = await res.json()
            const access = data?.access ?? data?.tokens?.access
            const refresh = data?.refresh ?? data?.tokens?.refresh
            if (!access || !refresh) {
                setError("Réponse OTP invalide")
                return
            }

            await completeLogin({ access, refresh })
            sessionStorage.removeItem("pending_2fa_user")
            sessionStorage.removeItem("pending_2fa_challenge")
            sessionStorage.removeItem("pending_2fa_method")
            sessionStorage.removeItem("pending_2fa_temp_token")

            setDone(true)
            setTimeout(() => navigate("/dashboard"), 900)
        } catch (err: any) {
            setError(err.message || "Invalid code. Try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-mark">K</div>
                    <span className="auth-logo-text">ÔRÂ</span>
                </div>

                <div className={`tfa-verify-wrap ${done ? "tfa-verify-wrap--done" : ""}`}>
                    <div className="tfa-verify-shield">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="1.8">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </div>

                    <h1 className="auth-title">Two-Step Verification</h1>
                    <p className="auth-subtitle">
                        Enter the 6-digit code from your <strong>Google Authenticator</strong> app
                    </p>


                    <input
                        type="text" inputMode="numeric" maxLength={6}
                        placeholder="000000" className="tfa-code-input"
                        value={code}
                        onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError("") }}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        autoFocus disabled={done}
                    />

                    <p className="tfa-timer">Code refreshes every 30 seconds</p>
                    {error && <div className="tfa-error">{error}</div>}

                    <button
                        className={`tfa-btn ${done ? "tfa-btn--success" : ""}`}
                        onClick={handleSubmit}
                        disabled={loading || done || code.length !== 6}
                    >
                        {done
                            ? <><span className="tfa-check">✓</span> Verified!</>
                            : loading
                                ? <span className="tfa-spinner"/>
                                : <>Confirm <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                        }
                    </button>

                    <button className="tfa-back" onClick={() => navigate("/login")} disabled={done}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        Back to login
                    </button>
                </div>
            </div>
        </div>
    )
}

export default TwoFactorVerify