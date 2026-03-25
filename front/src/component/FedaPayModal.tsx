import { useState, useEffect } from "react"
import { useFedaPay } from "./useFedaPay"

const FEDAPAY_PUBLIC_KEY = import.meta.env.VITE_FEDAPAY_PUBLIC_KEY ?? "pk_sandbox_XXXXXXXXXXXX"
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

interface Payment {
    id:          string
    amount:      number
    description: string
    date:        string
    status:      "success" | "pending" | "failed"
    ref?:        string
}

interface FedaPayModalProps {
    onClose: () => void
    // Pré-remplissage depuis le contexte (bien loué, locataire connecté…)
    defaultAmount?:      number
    defaultDescription?: string
    customer?: {
        firstname?: string
        lastname?:  string
        email?:     string
        phone?:     string
    }
}

export const FedaPayModal = ({
    onClose,
    defaultAmount      = 0,
    defaultDescription = "",
    customer           = {},
}: FedaPayModalProps) => {
    const { ready, loading, openPayment } = useFedaPay(FEDAPAY_PUBLIC_KEY)
    const [amount,      setAmount]      = useState(defaultAmount  > 0 ? String(defaultAmount) : "")
    const [description, setDescription] = useState(defaultDescription)
    const [phone,       setPhone]       = useState(customer.phone ?? "")
    const [payments,    setPayments]    = useState<Payment[]>([])
    const [lastPay,     setLastPay]     = useState<Payment|null>(null)
    const [step,        setStep]        = useState<"form"|"success"|"cancelled">("form")
    const token = localStorage.getItem("access_token")

    // Charge l'historique depuis l'API si disponible
    useEffect(() => {
        fetch(`${BASE_URL}/api/paiements/`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => setPayments(Array.isArray(data) ? data : data.results ?? []))
            .catch(() => {})
    }, [])

    const handlePay = () => {
        const amt = parseFloat(amount)
        if (!amt || amt <= 0 || !description.trim()) return

        openPayment({
            amount:      amt,
            description: description.trim(),
            customer:    { ...customer, phone: phone || customer.phone },
            onSuccess: (tx) => {
                const p: Payment = {
                    id:          tx.id ?? String(Date.now()),
                    amount:      amt,
                    description: description,
                    date:        new Date().toISOString(),
                    status:      "success",
                    ref:         tx.reference ?? tx.id,
                }
                setLastPay(p)
                setPayments(prev => [p, ...prev])
                setStep("success")

                // Optionnel : notifier le backend
                fetch(`${BASE_URL}/api/paiements/enregistrer/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ montant: amt, description, reference: tx.reference ?? tx.id, statut: "SUCCESS" })
                }).catch(() => {})
            },
            onCancel: () => setStep("cancelled"),
        })
    }

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px 14px",
        borderRadius: 10,
        border: "1.5px solid var(--border)",
        fontSize: 14,
        background: "var(--bg)",
        color: "var(--text)",
        outline: "none",
        boxSizing: "border-box",
    }
    const labelStyle: React.CSSProperties = {
        fontSize: 11.5,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: ".06em",
        color: "var(--text3)",
        display: "block",
        marginBottom: 6,
    }

    return (
        <div style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
        }}>
            <div style={{
                background: "#fff",
                borderRadius: 22,
                width: 480,
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "0 24px 64px rgba(0,0,0,.22)",
            }}>

                {/* ── Header ── */}
                <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--dark)" }}>Paiement</div>
                        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>Sécurisé par FedaPay</div>
                    </div>
                    <button onClick={onClose} style={{ background: "var(--bg2)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "var(--text3)", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <div style={{ padding: "20px 28px 28px" }}>

                    {/* ── Formulaire ── */}
                    {step === "form" && (
                        <>
                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Montant (XOF) *</label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="ex: 50000"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        style={{ ...inputStyle, paddingRight: 54 }}
                                    />
                                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: "var(--text3)" }}>XOF</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Motif *</label>
                                <input
                                    type="text"
                                    placeholder="ex: Loyer mois de janvier"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={labelStyle}>Téléphone (Mobile Money)</label>
                                <input
                                    type="tel"
                                    placeholder="ex: 90000000"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    style={inputStyle}
                                />
                                <div style={{ fontSize: 11.5, color: "var(--text3)", marginTop: 6 }}>
                                    T-Money, Flooz, Moov Money, Wave…
                                </div>
                            </div>

                            {/* Méthodes disponibles */}
                            <div style={{ display: "flex", gap: 8, marginBottom: 22, padding: "12px 14px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
                                <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5, flex: 1 }}>
                                    Moyens de paiement acceptés : T-Money · Flooz · Moov Money · Wave · Carte bancaire
                                </div>
                            </div>

                            <button
                                onClick={handlePay}
                                disabled={!ready || loading || !amount || !description.trim()}
                                style={{
                                    width: "100%",
                                    padding: "13px",
                                    background: "#1a1814",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 12,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: (!ready || loading || !amount || !description.trim()) ? "not-allowed" : "pointer",
                                    opacity: (!ready || !amount || !description.trim()) ? 0.5 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                }}
                            >
                                {loading ? (
                                    <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }}/>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                                )}
                                {loading ? "Ouverture…" : `Payer ${amount ? parseFloat(amount).toLocaleString() : "—"} XOF`}
                            </button>

                            {!ready && (
                                <div style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", marginTop: 8 }}>
                                    Chargement de FedaPay…
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Succès ── */}
                    {step === "success" && lastPay && (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: "50%",
                                background: "#f0fdf4", border: "2px solid #bbf7d0",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 16px",
                            }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Paiement réussi</div>
                            <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 20, lineHeight: 1.6 }}>
                                {lastPay.amount.toLocaleString()} XOF · {lastPay.description}
                                {lastPay.ref && <><br/><span style={{ fontSize: 11, fontFamily: "monospace" }}>Réf: {lastPay.ref}</span></>}
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={() => setStep("form")} style={{ flex: 1, padding: "11px", border: "1.5px solid var(--border)", borderRadius: 11, background: "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                    Nouveau paiement
                                </button>
                                <button onClick={onClose} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 11, background: "#1a1814", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                    Fermer
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Annulé ── */}
                    {step === "cancelled" && (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Paiement annulé</div>
                            <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 20 }}>Le paiement a été interrompu.</div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={() => setStep("form")} style={{ flex: 1, padding: "11px", border: "none", borderRadius: 11, background: "#1a1814", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                    Réessayer
                                </button>
                                <button onClick={onClose} style={{ flex: 1, padding: "11px", border: "1.5px solid var(--border)", borderRadius: 11, background: "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                    Fermer
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Historique ── */}
                    {step === "form" && payments.length > 0 && (
                        <div style={{ marginTop: 28, borderTop: "1px solid var(--border)", paddingTop: 18 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text3)", marginBottom: 12 }}>
                                Historique récent
                            </div>
                            {payments.slice(0, 4).map((p, i) => (
                                <div key={p.id ?? i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: "50%",
                                        background: p.status === "success" ? "#f0fdf4" : p.status === "failed" ? "#fef2f2" : "var(--bg2)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        {p.status === "success"
                                            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                            : p.status === "failed"
                                            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        }
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.description}</div>
                                        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>
                                            {new Date(p.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: 800, fontSize: 13, color: "var(--dark)", whiteSpace: "nowrap" }}>
                                        {p.amount.toLocaleString()} XOF
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default FedaPayModal
