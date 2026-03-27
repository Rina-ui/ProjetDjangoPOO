import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import "../../style/auth.css"
import "../../style/twofa.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
type Step = "qr" | "verify" | "success"

const TwoFactorSetup = () => {
    const navigate  = useNavigate()
    useAuth()

    const [step,    setStep]    = useState<Step>("qr")
    const [prev,    setPrev]    = useState<Step>("qr")
    const [anim,    setAnim]    = useState(false)
    const [code,    setCode]    = useState("")
    const [error,   setError]   = useState("")
    const [loading, setLoading] = useState(false)
    const [qrCode,  setQrCode]  = useState("")
    const [secret,  setSecret]  = useState("")
    const [fetching, setFetching] = useState(true)

    // Charger le QR code depuis le backend au montage
    useEffect(() => {
        const token = localStorage.getItem("access_token")
        fetch(`${BASE_URL}/api/auth/2fa/setup/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                setQrCode(data.qr_code || data.qr || data.otpauth_url || "")
                setSecret(data.secret || data.base32 || "")
            })
            .catch(() => setError("Failed to load QR code"))
            .finally(() => setFetching(false))
    }, [])

    const goTo = (next: Step) => {
        setPrev(step)
        setAnim(true)
        setTimeout(() => { setStep(next); setAnim(false) }, 300)
    }

    const handleVerify = async () => {
        if (code.length !== 6) { setError("Code must be 6 digits"); return }
        setLoading(true); setError("")
        try {
            const token = localStorage.getItem("access_token")
            const res = await fetch(`${BASE_URL}/api/auth/2fa/verify/`, {
                method:  "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:  `Bearer ${token}`
                },
                body: JSON.stringify({ code, otp: code })
            })
            if (!res.ok) {
                const err = await res.json().catch(() => null)
                setError(err?.detail || err?.message || "Invalid code. Check your app and try again.")
                return
            }
            goTo("success")
        } catch {
            setError("Invalid code. Check your app and try again.")
        } finally {
            setLoading(false)
        }
    }

    const forward = (prev === "qr" && step !== "qr") || (prev === "verify" && step === "success")

    return (
        <div className="auth-page">
            <div className="tfa-setup-card">
                <div className="auth-logo">
                    <div className="auth-logo-mark">K</div>
                    <span className="auth-logo-text">ÔRÂ</span>
                </div>

                <div className="tfa-progress">
                    {(["qr","verify","success"] as Step[]).map((s, i) => (
                        <div key={s} className={[
                            "tfa-dot",
                            step === s ? "tfa-dot--active" : "",
                            (i === 0 && step !== "qr") || (i === 1 && step === "success") ? "tfa-dot--done" : ""
                        ].join(" ")}/>
                    ))}
                </div>

                <div className={`tfa-pane ${anim ? "tfa-pane--exit" : "tfa-pane--enter"} ${forward ? "tfa-pane--fwd" : "tfa-pane--bwd"}`}>

                    {step === "qr" && (
                        <div className="tfa-step-content">
                            <div className="tfa-step-icon tfa-step-icon--blue">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                                </svg>
                            </div>
                            <h2 className="tfa-title">Scan QR Code</h2>
                            <p className="tfa-sub">Open <strong>Google Authenticator</strong>, tap <strong>"+"</strong> and scan below</p>

                            <div className="tfa-qr-box">
                                {fetching
                                    ? <div style={{ width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 13 }}>Loading…</div>
                                    : <img src={qrCode} alt="2FA QR Code" className="tfa-qr-img"/>
                                }
                                <span className="tfa-qr-label">KÔRÂ · Authenticator</span>
                            </div>

                            <div className="tfa-secret-row">
                                <span className="tfa-secret-label">Manual entry key</span>
                                <code className="tfa-secret-code">{secret || "Loading…"}</code>
                            </div>

                            <button className="tfa-btn" onClick={() => goTo("verify")} disabled={fetching}>
                                I've scanned it
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </button>
                        </div>
                    )}

                    {step === "verify" && (
                        <div className="tfa-step-content">
                            <div className="tfa-step-icon tfa-step-icon--gold">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                </svg>
                            </div>
                            <h2 className="tfa-title">Enter the code</h2>
                            <p className="tfa-sub">Type the 6-digit code from <strong>Google Authenticator</strong></p>

                            <input
                                type="text" inputMode="numeric" maxLength={6}
                                placeholder="000000" className="tfa-code-input"
                                value={code}
                                onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError("") }}
                                onKeyDown={e => e.key === "Enter" && handleVerify()}
                                autoFocus
                            />
                            <p className="tfa-timer">Code refreshes every 30 seconds</p>
                            {error && <div className="tfa-error">{error}</div>}

                            <button className="tfa-btn" onClick={handleVerify} disabled={loading || code.length !== 6}>
                                {loading ? <span className="tfa-spinner"/> : <>Verify & Enable <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
                            </button>
                            <button className="tfa-back" onClick={() => goTo("qr")}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                                Back
                            </button>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="tfa-step-content tfa-step-content--center">
                            <div className="tfa-success-ring">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </div>
                            <h2 className="tfa-title">2FA Enabled!</h2>
                            <p className="tfa-sub">Your account is now protected.</p>
                            <button className="tfa-btn tfa-btn--green" onClick={() => navigate("/dashboard")}>
                                Go to Dashboard
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default TwoFactorSetup