import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../../style/auth.css"
import "../../style/twofa.css"

type Step = "qr" | "verify" | "success"

const QR_PLACEHOLDER = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/KORA:user@example.com?secret=PLACEHOLDER&issuer=KORA"

const TwoFactorSetup = () => {
    const navigate = useNavigate()
    const [step,    setStep]    = useState<Step>("qr")
    const [prev,    setPrev]    = useState<Step>("qr")
    const [anim,    setAnim]    = useState(false)
    const [code,    setCode]    = useState("")
    const [error,   setError]   = useState("")
    const [loading, setLoading] = useState(false)

    const goTo = (next: Step) => {
        setPrev(step)
        setAnim(true)
        setTimeout(() => { setStep(next); setAnim(false) }, 300)
    }

    const handleVerify = async () => {
        if (code.length !== 6) { setError("Code must be 6 digits"); return }
        setLoading(true); setError("")
        try {
            // TODO: replace with real API call
            await new Promise(r => setTimeout(r, 700))
            if (code !== "123456") { setError("Invalid code. Check your app and try again."); return }
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

                {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-mark">K</div>
                    <span className="auth-logo-text">ÔRÂ</span>
                </div>

                {/* Progress */}
                <div className="tfa-progress">
                    {(["qr","verify","success"] as Step[]).map((s, i) => (
                        <div key={s} className={[
                            "tfa-dot",
                            step === s ? "tfa-dot--active" : "",
                            (i === 0 && step !== "qr") || (i === 1 && step === "success") ? "tfa-dot--done" : ""
                        ].join(" ")}/>
                    ))}
                </div>

                {/* Slide pane */}
                <div className={`tfa-pane ${anim ? "tfa-pane--exit" : "tfa-pane--enter"} ${forward ? "tfa-pane--fwd" : "tfa-pane--bwd"}`}>

                    {step === "qr" && (
                        <div className="tfa-step-content">
                            <div className="tfa-step-icon tfa-step-icon--blue">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                                    <rect x="14" y="14" width="3" height="3" rx="0.5"/><rect x="18" y="14" width="3" height="3" rx="0.5"/>
                                    <rect x="14" y="18" width="3" height="3" rx="0.5"/><rect x="18" y="18" width="3" height="3" rx="0.5"/>
                                </svg>
                            </div>
                            <h2 className="tfa-title">Scan QR Code</h2>
                            <p className="tfa-sub">Open <strong>Google Authenticator</strong>, tap <strong>"+"</strong> and scan the code below</p>

                            <div className="tfa-qr-box">
                                {/* TODO: replace QR_PLACEHOLDER with qrCodeUrl from backend */}
                                <img src={QR_PLACEHOLDER} alt="2FA QR Code" className="tfa-qr-img"/>
                                <span className="tfa-qr-label">KÔRÂ · Authenticator</span>
                            </div>

                            <div className="tfa-secret-row">
                                <span className="tfa-secret-label">Manual entry key</span>
                                {/* TODO: replace with secret from backend */}
                                <code className="tfa-secret-code">XXXX XXXX XXXX XXXX</code>
                            </div>

                            <button className="tfa-btn" onClick={() => goTo("verify")}>
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
                            <p className="tfa-sub">Type the 6-digit code shown in <strong>Google Authenticator</strong></p>

                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="000000"
                                className="tfa-code-input"
                                value={code}
                                onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError("") }}
                                onKeyDown={e => e.key === "Enter" && handleVerify()}
                                autoFocus
                            />
                            <p className="tfa-timer">Code refreshes every 30 seconds</p>
                            {error && <div className="tfa-error">{error}</div>}

                            <button className="tfa-btn" onClick={handleVerify} disabled={loading || code.length !== 6}>
                                {loading
                                    ? <span className="tfa-spinner"/>
                                    : <>Verify & Enable <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                                }
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
                            <p className="tfa-sub">Your account is now protected with two-factor authentication.</p>
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