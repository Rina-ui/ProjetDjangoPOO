import { useState, useEffect } from "react"
import DashboardLayout from "../../../component/sidebar"
import { NotificationBell } from "../../../component/NotificationBell.tsx"
import { calcSplit, DEFAULT_COMMISSION } from "../../../context/PaymentContext"
import "../../../style/dashboard.css"
import "../../../style/owner-pages.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
const NAV_ITEMS = [
    { label: "Dashboard",    path: "/dashboard/admin" },
    { label: "Leads",        path: "/dashboard/admin/leads" },
    { label: "Properties",   path: "/dashboard/admin/properties" },
    { label: "Transactions", path: "/dashboard/admin/transactions" },
    { label: "Calendar",     path: "/dashboard/admin/calendar" },
    { label: "Settings",     path: "/dashboard/admin/settings" },
]

const fmt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" })

const ss: Record<string, { bg:string; color:string; label:string }> = {
    SUCCESS: { bg:"#f0fdf4", color:"#15803d", label:"Réussi"     },
    PENDING: { bg:"#fffbeb", color:"#92400e", label:"En attente" },
    FAILED:  { bg:"#fef2f2", color:"#c0392b", label:"Échoué"     },
}

// ── Panneau commissions ───────────────────────────────────
const CommissionPanel = ({ onClose }: { onClose: () => void }) => {
    const [biens,   setBiens]   = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving,  setSaving]  = useState<number|null>(null)
    const [saved,   setSaved]   = useState<number|null>(null)
    const [taux,    setTaux]    = useState<Record<number,string>>({})
    const token = localStorage.getItem("access_token")

    useEffect(() => {
        fetch(`${BASE_URL}/api/patrimoine/biens/`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(d => {
            const list = Array.isArray(d) ? d : d.results ?? []
            setBiens(list)
            const init: Record<number,string> = {}
            list.forEach((b: any) => {
                const t = b.taux_commission ?? b.commission ?? DEFAULT_COMMISSION
                init[b.id] = String(Math.round(t <= 1 ? t * 100 : t))
            })
            setTaux(init)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    const save = async (b: any) => {
        const raw = parseFloat(taux[b.id] ?? "10")
        if (isNaN(raw) || raw < 0 || raw > 50) return
        setSaving(b.id)
        try {
            await fetch(`${BASE_URL}/api/patrimoine/biens/${b.id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ taux_commission: raw / 100 }),
            })
            setSaved(b.id); setTimeout(() => setSaved(null), 2000)
        } finally { setSaving(null) }
    }

    return (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(2px)" }}>
            <div style={{ background:"#fff", borderRadius:20, width:520, maxHeight:"85vh", overflow:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.22)" }}>
                <div style={{ padding:"22px 24px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div>
                        <div style={{ fontSize:16, fontWeight:800, color:"var(--dark)" }}>Commissions par bien</div>
                        <div style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>Taux appliqué à chaque paiement de loyer</div>
                    </div>
                    <button onClick={onClose} style={{ background:"var(--bg2)", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text3)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div style={{ padding:"14px 24px 24px" }}>
                    {loading ? (
                        <div className="op-skeleton-group">{[1,2,3].map(i => <div key={i} className="op-skeleton" style={{ height:64, borderRadius:10 }}/>)}</div>
                    ) : biens.length === 0 ? (
                        <div className="op-empty-sm">Aucun bien</div>
                    ) : biens.map(b => {
                        const cur = parseFloat(taux[b.id] ?? "10")
                        const loyer = parseFloat(b.loyer_hc ?? 0)
                        const { agence, proprio } = calcSplit(loyer, cur / 100)
                        return (
                            <div key={b.id} style={{ padding:"14px 0", borderBottom:"1px solid var(--border)" }}>
                                <div style={{ fontSize:13, fontWeight:700, color:"var(--dark)", marginBottom:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.adresse}</div>
                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                    <div style={{ position:"relative", width:88 }}>
                                        <input type="number" min="0" max="50" step="0.5"
                                               value={taux[b.id] ?? "10"}
                                               onChange={e => setTaux(p => ({ ...p, [b.id]: e.target.value }))}
                                               style={{ width:"100%", padding:"8px 28px 8px 10px", borderRadius:9, border:"1.5px solid var(--border)", fontSize:14, fontWeight:700, outline:"none", background:"var(--bg)", color:"var(--dark)", boxSizing:"border-box" }}
                                        />
                                        <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:12, fontWeight:700, color:"var(--text3)" }}>%</span>
                                    </div>
                                    <div style={{ flex:1, display:"flex", gap:7, flexWrap:"wrap", fontSize:12 }}>
                                        <span style={{ background:"#f0fdf4", color:"#2d6a4f", padding:"3px 10px", borderRadius:20, fontWeight:700 }}>Proprio: {proprio.toLocaleString()} XOF</span>
                                        <span style={{ background:"#faf5e8", color:"#92400e", padding:"3px 10px", borderRadius:20, fontWeight:700 }}>Agence: {agence.toLocaleString()} XOF</span>
                                    </div>
                                    <button onClick={() => save(b)} disabled={saving === b.id} style={{ padding:"8px 14px", borderRadius:9, border:"none", background:saved===b.id?"#15803d":"#1a1814", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", minWidth:60, transition:"background .2s" }}>
                                        {saving===b.id ? "…" : saved===b.id ? "OK" : "Sauver"}
                                    </button>
                                </div>
                                <div style={{ marginTop:8, height:4, background:"var(--bg2)", borderRadius:99, overflow:"hidden", display:"flex" }}>
                                    <div style={{ width:`${100-cur}%`, background:"#2d6a4f", height:"100%", borderRadius:"99px 0 0 99px", transition:"width .3s" }}/>
                                    <div style={{ width:`${cur}%`, background:"#b8922a", height:"100%", borderRadius:"0 99px 99px 0", transition:"width .3s" }}/>
                                </div>
                                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--text3)", marginTop:3 }}>
                                    <span>Propriétaire {(100-cur).toFixed(1)}%</span>
                                    <span>Agence {cur}%</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ── Page transactions ─────────────────────────────────────
export const AdminTransactionsPage = () => {
    const [payments, setPayments] = useState<any[]>([])
    const [loading,  setLoading]  = useState(true)
    const [filter,   setFilter]   = useState<"all"|"success"|"pending"|"failed">("all")
    const [search,   setSearch]   = useState("")
    const [ready,    setReady]    = useState(false)
    const [showComm, setShowComm] = useState(false)
    const token = localStorage.getItem("access_token")

    useEffect(() => {
        fetch(`${BASE_URL}/api/paiements/tous/`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(d => { setPayments(Array.isArray(d) ? d : d.results ?? []); setLoading(false); setTimeout(() => setReady(true), 80) })
            .catch(() => { setLoading(false); setTimeout(() => setReady(true), 80) })
    }, [])

    const rows = payments
        .filter(p => filter === "all" || p.statut?.toLowerCase() === filter)
        .filter(p => !search || p.bien_adresse?.toLowerCase().includes(search.toLowerCase()) || p.locataire_nom?.toLowerCase().includes(search.toLowerCase()))

    const ok          = payments.filter(p => p.statut === "SUCCESS")
    const total       = ok.reduce((a, p) => a + (p.montant ?? 0), 0)
    const totalAgence = ok.reduce((a, p) => a + (p.montant_agence ?? calcSplit(p.montant ?? 0, p.taux_commission).agence), 0)
    const totalProprio = total - totalAgence
    const avgPct      = ok.length ? Math.round(ok.reduce((a, p) => a + ((p.taux_commission ?? DEFAULT_COMMISSION) * 100), 0) / ok.length) : Math.round(DEFAULT_COMMISSION * 100)

    const Tile = ({ l, v, sub, c }: { l:string; v:string|number; sub?:string; c?:string }) => (
        <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"16px 18px" }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--text3)", marginBottom:5 }}>{l}</div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-.03em", color:c??"var(--dark)", lineHeight:1 }}>{v}</div>
            {sub && <div style={{ fontSize:11.5, color:"var(--text3)", marginTop:4 }}>{sub}</div>}
        </div>
    )

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Transactions" pageAction={<NotificationBell/>}>
            <div className={`op-page ${ready ? "op-visible" : ""}`} style={{ gap:18 }}>
                <div className="op-head">
                    <div>
                        <h1 className="op-title">Transactions</h1>
                        <p className="op-subtitle">{payments.length} paiements · commission moy. {avgPct}%</p>
                    </div>
                    <button onClick={() => setShowComm(true)} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"9px 18px", borderRadius:11, border:"1.5px solid var(--border)", background:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", color:"var(--text2)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>
                        Gérer les commissions
                    </button>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                    <Tile l="Volume total"         v={`${total.toLocaleString()} XOF`}        sub={`${ok.length} réussis`}/>
                    <Tile l="Commissions agence"   v={`${totalAgence.toLocaleString()} XOF`}  sub={`moy. ${avgPct}%`}        c="#b8922a"/>
                    <Tile l="Reversé propriétaires" v={`${totalProprio.toLocaleString()} XOF`} sub="net proprios"             c="#2d6a4f"/>
                    <Tile l="En attente"           v={payments.filter(p=>p.statut==="PENDING").length} sub="non confirmés"   c="#92400e"/>
                </div>

                {total > 0 && (
                    <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"16px 20px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:600, color:"var(--text3)", marginBottom:8 }}>
                            <span>Répartition du volume</span>
                            <span>{total.toLocaleString()} XOF</span>
                        </div>
                        <div style={{ height:8, background:"var(--bg2)", borderRadius:99, overflow:"hidden", display:"flex" }}>
                            <div style={{ width:`${Math.round(totalProprio/total*100)}%`, background:"#2d6a4f", height:"100%", borderRadius:"99px 0 0 99px", transition:"width .8s" }}/>
                            <div style={{ width:`${Math.round(totalAgence/total*100)}%`, background:"#b8922a", height:"100%", borderRadius:"0 99px 99px 0" }}/>
                        </div>
                        <div style={{ display:"flex", gap:16, marginTop:8, fontSize:11, color:"var(--text3)" }}>
                            <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:8, height:8, borderRadius:2, background:"#2d6a4f", display:"inline-block" }}/> Propriétaires — {totalProprio.toLocaleString()} XOF</span>
                            <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:8, height:8, borderRadius:2, background:"#b8922a", display:"inline-block" }}/> Agence — {totalAgence.toLocaleString()} XOF</span>
                        </div>
                    </div>
                )}

                <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:14, padding:"18px 20px" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:16, flexWrap:"wrap" }}>
                        <div style={{ display:"flex", gap:4 }}>
                            {(["all","success","pending","failed"] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid transparent", background:filter===f?"var(--dark)":"transparent", color:filter===f?"#fff":"var(--text3)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                                    {{ all:"Tous", success:"Réussis", pending:"En attente", failed:"Échoués" }[f]}
                                </button>
                            ))}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--bg)", border:"1.5px solid var(--border)", borderRadius:10, padding:"7px 12px" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Locataire, adresse…" style={{ border:"none", background:"transparent", fontSize:13, color:"var(--text)", outline:"none", width:160 }}/>
                        </div>
                    </div>

                    {loading ? (
                        <div className="op-skeleton-group">{[1,2,3,4].map(i => <div key={i} className="op-skeleton" style={{ height:48, borderRadius:8 }}/>)}</div>
                    ) : rows.length === 0 ? (
                        <div className="op-empty-sm" style={{ textAlign:"center", padding:"28px 0" }}>Aucun paiement trouvé</div>
                    ) : (
                        <div style={{ overflowX:"auto" }}>
                            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                                <thead>
                                <tr>{["Date","Locataire","Bien","Montant","Comm.","Proprio","Agence","Statut"].map(h => (
                                    <th key={h} style={{ textAlign:"left", fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--text3)", padding:"0 10px 10px 0", whiteSpace:"nowrap" }}>{h}</th>
                                ))}</tr>
                                </thead>
                                <tbody>
                                {rows.map((p,i) => {
                                    const st = ss[p.statut] ?? ss.PENDING
                                    const t  = p.taux_commission ?? DEFAULT_COMMISSION
                                    const { agence, proprio } = calcSplit(p.montant ?? 0, t)
                                    return (
                                        <tr key={p.id??i} style={{ borderTop:"1px solid var(--border)" }}>
                                            <td style={{ padding:"11px 10px 11px 0", color:"var(--text3)", fontSize:12, whiteSpace:"nowrap" }}>{fmt(p.created_at)}</td>
                                            <td style={{ padding:"11px 10px", fontWeight:600, color:"var(--dark)", whiteSpace:"nowrap" }}>{p.locataire_nom ?? "—"}</td>
                                            <td style={{ padding:"11px 10px", color:"var(--text2)", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.bien_adresse ?? "—"}</td>
                                            <td style={{ padding:"11px 10px", fontWeight:800, color:"var(--dark)", whiteSpace:"nowrap" }}>{(p.montant??0).toLocaleString()}</td>
                                            <td style={{ padding:"11px 10px" }}><span style={{ fontSize:11, fontWeight:700, background:"var(--bg2)", color:"var(--text3)", padding:"2px 8px", borderRadius:20 }}>{Math.round(t*100)}%</span></td>
                                            <td style={{ padding:"11px 10px", fontWeight:700, color:"#2d6a4f", whiteSpace:"nowrap" }}>{proprio.toLocaleString()}</td>
                                            <td style={{ padding:"11px 10px", fontWeight:700, color:"#b8922a", whiteSpace:"nowrap" }}>{agence.toLocaleString()}</td>
                                            <td style={{ padding:"11px 10px" }}><span style={{ fontSize:10, fontWeight:700, background:st.bg, color:st.color, padding:"3px 9px", borderRadius:20 }}>{st.label}</span></td>
                                        </tr>
                                    )
                                })}
                                </tbody>
                                <tfoot>
                                <tr style={{ borderTop:"2px solid var(--border)" }}>
                                    <td colSpan={3} style={{ padding:"10px 10px 0 0", fontSize:12, fontWeight:700, color:"var(--text3)" }}>Total ({rows.filter(p=>p.statut==="SUCCESS").length} réussis)</td>
                                    <td style={{ padding:"10px 10px 0", fontWeight:800, color:"var(--dark)" }}>{rows.filter(p=>p.statut==="SUCCESS").reduce((a,p)=>a+(p.montant??0),0).toLocaleString()} XOF</td>
                                    <td/>
                                    <td style={{ padding:"10px 10px 0", fontWeight:800, color:"#2d6a4f" }}>{rows.filter(p=>p.statut==="SUCCESS").reduce((a,p)=>a+calcSplit(p.montant??0,p.taux_commission).proprio,0).toLocaleString()} XOF</td>
                                    <td style={{ padding:"10px 10px 0", fontWeight:800, color:"#b8922a" }}>{rows.filter(p=>p.statut==="SUCCESS").reduce((a,p)=>a+calcSplit(p.montant??0,p.taux_commission).agence,0).toLocaleString()} XOF</td>
                                    <td/>
                                </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            {showComm && <CommissionPanel onClose={() => setShowComm(false)}/>}
        </DashboardLayout>
    )
}

export default AdminTransactionsPage