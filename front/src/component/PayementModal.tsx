import { useState, useEffect } from "react"
import { useFedaPay } from "../hook/useFedaPay.ts"
import { usePayments, calcSplit, DEFAULT_COMMISSION } from "../context/PaymentContext"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

interface Props {
    onClose:  () => void
    bien: {
        id:               number
        adresse:          string
        loyer_hc:         number
        charges?:         number
        proprietaire_nom?: string
        taux_commission?: number   // float, ex 0.08
        commission?:      number   // alias int%, ex 8
    }
    tenant?: {
        firstname?: string
        lastname?:  string
        email?:     string
        phone?:     string
    }
}

type Step = "form" | "processing" | "success" | "failed"

export const PaymentModal = ({ onClose, bien, tenant }: Props) => {
    const { addPayment } = usePayments()
    const { ready, loading, pay } = useFedaPay()

    const [step,    setStep]    = useState<Step>("form")
    const [mois,    setMois]    = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` })
    const [phone,   setPhone]   = useState(tenant?.phone ?? "")
    const [ref,     setRef]     = useState("")
    const [history, setHistory] = useState<any[]>([])

    const token = localStorage.getItem("access_token")

    // Résoudre le taux depuis le bien
    const taux = bien.taux_commission
        ?? (bien.commission != null ? bien.commission / 100 : undefined)
        ?? DEFAULT_COMMISSION

    const loyer   = bien.loyer_hc ?? 0
    const charges = bien.charges  ?? 0
    const total   = loyer + charges
    const { agence, proprio } = calcSplit(total, taux)
    const pct      = Math.round(taux * 100)
    const moisLbl  = new Date(mois + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

    useEffect(() => {
        fetch(`${BASE_URL}/api/paiements/?bien=${bien.id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(d => setHistory(Array.isArray(d) ? d : d.results ?? []))
            .catch(() => {})
    }, [bien.id])

    const handlePay = () => {
        if (!ready) return
        setStep("processing")
        pay({
            amount:      total,
            description: `Loyer ${moisLbl} — ${bien.adresse}`,
            customer:    { firstname: tenant?.firstname, lastname: tenant?.lastname, email: tenant?.email, phone: phone || tenant?.phone },
            onSuccess: async (tx) => {
                const txRef = tx?.reference ?? tx?.id ?? ""
                setRef(txRef)
                await addPayment({
                    montant:          total,
                    montant_proprio:  proprio,
                    montant_agence:   agence,
                    taux_commission:  taux,
                    description:      `Loyer ${moisLbl}`,
                    statut:           "SUCCESS",
                    reference:        txRef,
                    bien_adresse:     bien.adresse,
                    bien_id:          bien.id,
                    locataire_nom:    `${tenant?.firstname ?? ""} ${tenant?.lastname ?? ""}`.trim(),
                    proprietaire_nom: bien.proprietaire_nom ?? "",
                    mois,
                })
                setHistory(h => [{ montant: total, description: `Loyer ${moisLbl}`, statut: "SUCCESS", created_at: new Date().toISOString(), taux_commission: taux }, ...h])
                setStep("success")
            },
            onCancel: () => setStep("form"),
        })
    }

    const is = (v: React.CSSProperties): React.CSSProperties => ({
        width: "100%", padding: "10px 12px", borderRadius: 10,
        border: "1.5px solid var(--border)", fontSize: 13,
        background: "var(--bg)", color: "var(--text)",
        outline: "none", boxSizing: "border-box", ...v,
    })

    return (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.52)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, backdropFilter:"blur(3px)" }}>
            <div style={{ background:"#fff", borderRadius:22, width:460, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 28px 72px rgba(0,0,0,.24)" }}>

                {/* Header */}
                <div style={{ padding:"22px 24px 0", display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                    <div>
                        <div style={{ fontSize:17, fontWeight:800, color:"var(--dark)" }}>Payer le loyer</div>
                        <div style={{ fontSize:12, color:"var(--text3)", marginTop:3, maxWidth:320, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{bien.adresse}</div>
                    </div>
                    <button onClick={onClose} style={{ background:"var(--bg2)", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", color:"var(--text3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <div style={{ padding:"16px 24px 24px" }}>

                    {/* ── FORM ── */}
                    {step === "form" && (<>
                        <div style={{ marginBottom:13 }}>
                            <label style={{ fontSize:10.5, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--text3)", display:"block", marginBottom:5 }}>Mois</label>
                            <input type="month" value={mois} onChange={e => setMois(e.target.value)} style={is({})}/>
                        </div>
                        <div style={{ marginBottom:16 }}>
                            <label style={{ fontSize:10.5, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--text3)", display:"block", marginBottom:5 }}>Téléphone Mobile Money</label>
                            <input type="tel" placeholder="ex: 90000000" value={phone} onChange={e => setPhone(e.target.value)} style={is({})}/>
                            <div style={{ fontSize:11, color:"var(--text3)", marginTop:4 }}>T-Money · Flooz · Moov · Wave</div>
                        </div>

                        {/* Montants */}
                        <div style={{ background:"var(--bg)", borderRadius:12, padding:"2px 14px", marginBottom:14 }}>
                            {[
                                { l:"Loyer hors charges", v:`${loyer.toLocaleString()} XOF` },
                                ...(charges > 0 ? [{ l:"Charges", v:`${charges.toLocaleString()} XOF` }] : []),
                                { l:"Total à payer", v:`${total.toLocaleString()} XOF`, bold:true },
                            ].map(r => (
                                <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--border)", fontSize:13 }}>
                                    <span style={{ color:"var(--text3)" }}>{r.l}</span>
                                    <span style={{ fontWeight: r.bold ? 800 : 600, color:"var(--dark)" }}>{r.v}</span>
                                </div>
                            ))}
                        </div>

                        {/* Répartition */}
                        <div style={{ border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", marginBottom:20 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                                <span style={{ fontSize:11, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--text3)" }}>Répartition</span>
                                <span style={{ fontSize:11, fontWeight:700, background:"var(--bg2)", color:"var(--text3)", padding:"2px 9px", borderRadius:20 }}>Commission {pct}%</span>
                            </div>
                            {[
                                { l:`Propriétaire (${100-pct}%)`, v:proprio, c:"#2d6a4f", p:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
                                { l:`Agence KÔRÂ (${pct}%)`,     v:agence,  c:"#b8922a", p:"M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
                            ].map(r => (
                                <div key={r.l} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                                    <div style={{ width:26, height:26, borderRadius:7, background:`${r.c}12`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={r.c} strokeWidth="2"><path d={r.p}/></svg>
                                    </div>
                                    <span style={{ flex:1, fontSize:12, color:"var(--text2)", fontWeight:500 }}>{r.l}</span>
                                    <span style={{ fontSize:13, fontWeight:800, color:r.c }}>{r.v.toLocaleString()} XOF</span>
                                </div>
                            ))}
                            <div style={{ marginTop:10, height:5, background:"var(--bg2)", borderRadius:99, overflow:"hidden", display:"flex" }}>
                                <div style={{ width:`${100-pct}%`, background:"#2d6a4f", height:"100%", borderRadius:"99px 0 0 99px" }}/>
                                <div style={{ width:`${pct}%`,     background:"#b8922a", height:"100%", borderRadius:"0 99px 99px 0" }}/>
                            </div>
                        </div>

                        <button onClick={handlePay} disabled={!ready || loading} style={{ width:"100%", padding:13, background:"#1a1814", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:ready?"pointer":"not-allowed", opacity:ready?1:.55, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                            {loading
                                ? <span style={{ width:15, height:15, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"pm-spin .7s linear infinite" }}/>
                                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                            }
                            {loading ? "Ouverture…" : `Payer ${total.toLocaleString()} XOF`}
                        </button>
                        {!ready && <div style={{ fontSize:11, color:"var(--text3)", textAlign:"center", marginTop:6 }}>Chargement FedaPay…</div>}

                        {/* Historique */}
                        {history.length > 0 && (
                            <div style={{ marginTop:22, borderTop:"1px solid var(--border)", paddingTop:14 }}>
                                <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--text3)", marginBottom:10 }}>Historique</div>
                                {history.slice(0,4).map((p,i) => (
                                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                                        <div style={{ width:28, height:28, borderRadius:8, background:p.statut==="SUCCESS"?"#f0fdf4":"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                            {p.statut === "SUCCESS"
                                                ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                                : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                            }
                                        </div>
                                        <div style={{ flex:1 }}>
                                            <div style={{ fontSize:12, fontWeight:600, color:"var(--dark)" }}>{p.description}</div>
                                            <div style={{ fontSize:11, color:"var(--text3)" }}>{new Date(p.created_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})}</div>
                                        </div>
                                        <div style={{ textAlign:"right" }}>
                                            <div style={{ fontSize:12, fontWeight:800, color:p.statut==="SUCCESS"?"#15803d":"#c0392b" }}>{p.montant?.toLocaleString()} XOF</div>
                                            {p.taux_commission != null && <div style={{ fontSize:10, color:"var(--text3)" }}>{Math.round(p.taux_commission*100)}%</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>)}

                    {/* ── PROCESSING ── */}
                    {step === "processing" && (
                        <div style={{ textAlign:"center", padding:"32px 0" }}>
                            <div style={{ width:48, height:48, border:"3px solid var(--border)", borderTopColor:"#b8922a", borderRadius:"50%", animation:"pm-spin .8s linear infinite", margin:"0 auto 18px" }}/>
                            <div style={{ fontSize:15, fontWeight:700, color:"var(--dark)", marginBottom:6 }}>Traitement…</div>
                            <div style={{ fontSize:13, color:"var(--text3)" }}>La fenêtre FedaPay est ouverte</div>
                        </div>
                    )}

                    {/* ── SUCCESS ── */}
                    {step === "success" && (
                        <div style={{ textAlign:"center", padding:"24px 0" }}>
                            <div style={{ width:64, height:64, borderRadius:"50%", background:"#f0fdf4", border:"2px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", animation:"pm-pop .4s cubic-bezier(.34,1.56,.64,1)" }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <div style={{ fontSize:17, fontWeight:800, marginBottom:5 }}>Paiement confirmé</div>
                            <div style={{ fontSize:13, color:"var(--text3)", marginBottom:8, lineHeight:1.6 }}>{total.toLocaleString()} XOF · {moisLbl}</div>
                            {ref && <div style={{ fontSize:11, fontFamily:"monospace", background:"var(--bg2)", padding:"3px 10px", borderRadius:6, display:"inline-block", color:"var(--text3)", marginBottom:18 }}>Réf: {ref}</div>}
                            <div style={{ background:"var(--bg)", borderRadius:12, padding:"10px 16px", textAlign:"left", marginBottom:18 }}>
                                {[
                                    { l:`Propriétaire (${100-pct}%)`, v:proprio, c:"#2d6a4f" },
                                    { l:`Agence KÔRÂ (${pct}%)`,     v:agence,  c:"#b8922a" },
                                ].map(r => (
                                    <div key={r.l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid var(--border)", fontSize:13 }}>
                                        <span style={{ color:"var(--text3)" }}>{r.l}</span>
                                        <span style={{ fontWeight:800, color:r.c }}>{r.v.toLocaleString()} XOF</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ fontSize:12, color:"var(--text3)", marginBottom:18 }}>Propriétaire et agence notifiés automatiquement.</div>
                            <button onClick={onClose} style={{ width:"100%", padding:12, background:"#1a1814", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer" }}>Fermer</button>
                        </div>
                    )}

                    {/* ── FAILED ── */}
                    {step === "failed" && (
                        <div style={{ textAlign:"center", padding:"28px 0" }}>
                            <div style={{ fontSize:15, fontWeight:700, color:"#c0392b", marginBottom:8 }}>Paiement échoué</div>
                            <div style={{ fontSize:13, color:"var(--text3)", marginBottom:20 }}>Vérifiez votre solde et réessayez.</div>
                            <div style={{ display:"flex", gap:10 }}>
                                <button onClick={() => setStep("form")} style={{ flex:1, padding:11, border:"none", borderRadius:11, background:"#1a1814", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Réessayer</button>
                                <button onClick={onClose} style={{ flex:1, padding:11, border:"1.5px solid var(--border)", borderRadius:11, background:"transparent", fontSize:13, fontWeight:600, cursor:"pointer" }}>Fermer</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes pm-spin{to{transform:rotate(360deg)}} @keyframes pm-pop{from{transform:scale(.5)}to{transform:scale(1)}}`}</style>
        </div>
    )
}

export default PaymentModal