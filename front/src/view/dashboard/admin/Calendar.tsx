import { useEffect, useState } from "react"
import DashboardLayout from "../../../component/sidebar"
import "../../../style/dashboard.css"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
const token = () => localStorage.getItem("access_token")

const NAV_ITEMS = [
    { label: "Dashboard",    path: "/dashboard/admin" },
    { label: "Leads",        path: "/dashboard/admin/leads" },
    { label: "Properties",   path: "/dashboard/admin/properties" },
    { label: "Transactions", path: "/dashboard/admin/transactions" },
    { label: "Calendar",     path: "/dashboard/admin/calendar" },
    { label: "Settings",     path: "/dashboard/admin/settings" },
]

interface Visite {
    id:          number
    bien_detail: { adresse: string; photo: string | null; proprietaire_nom: string }
    locataire_nom?: string
    locataire_email?: string
    locataire_telephone?: string
    date_visite: string
    statut:      string
    note:        string
}

const STATUT_COLOR: Record<string, { bg: string; color: string; dot: string }> = {
    EN_ATTENTE: { bg: "#fdf6e7", color: "#b8922a", dot: "#b8922a" },
    CONFIRMEE:  { bg: "#f0fdf4", color: "#15803d", dot: "#15803d" },
    ANNULEE:    { bg: "#fef2f2", color: "#c0392b", dot: "#c0392b" },
    EFFECTUEE:  { bg: "#f5f3ff", color: "#7c3aed", dot: "#7c3aed" },
}

const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]

// ── Modale détail + actions ───────────────────────────────
const VisiteDetailModal = ({
                               visite,
                               onClose,
                               onUpdate,
                           }: {
    visite: Visite
    onClose: () => void
    onUpdate: (id: number, statut: string) => void
}) => {
    const [loading,    setLoading]    = useState<"confirm"|"cancel"|null>(null)
    const [motif,      setMotif]      = useState("")
    const [showMotif,  setShowMotif]  = useState(false)
    const [done,       setDone]       = useState(false)
    const [actionDone, setActionDone] = useState<"confirm"|"cancel"|null>(null)

    const sc  = STATUT_COLOR[visite.statut] ?? STATUT_COLOR.EN_ATTENTE
    const d   = new Date(visite.date_visite)
    const isPending = visite.statut === "EN_ATTENTE"

    const act = async (action: "confirm"|"cancel") => {
        setLoading(action)
        try {
            const endpoint = action === "confirm"
                ? `${BASE_URL}/api/locataires/visites/${visite.id}/confirmer/`
                : `${BASE_URL}/api/locataires/visites/${visite.id}/annuler/`

            const body = action === "cancel" && motif.trim()
                ? JSON.stringify({ motif })
                : undefined

            const res = await fetch(endpoint, {
                method:  "POST",
                headers: {
                    Authorization: `Bearer ${token()}`,
                    ...(body ? { "Content-Type": "application/json" } : {}),
                },
                body,
            })

            if (!res.ok) throw new Error(await res.text())

            const newStatut = action === "confirm" ? "CONFIRMEE" : "ANNULEE"
            onUpdate(visite.id, newStatut)
            setActionDone(action)
            setDone(true)
        } catch (e: any) {
            console.error(e)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.52)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(3px)" }}>
            <div style={{ background:"#fff", borderRadius:22, width:460, maxHeight:"90vh", overflow:"auto", boxShadow:"0 28px 72px rgba(0,0,0,.22)" }}>

                {/* Header coloré selon statut */}
                <div style={{ background: isPending ? "#1a1814" : sc.bg, padding:"22px 24px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", borderBottom:`2px solid ${sc.dot}` }}>
                    <div>
                        <div style={{ fontSize:15, fontWeight:800, color: isPending ? "#fff" : sc.color }}>
                            Demande de visite
                        </div>
                        <div style={{ fontSize:12, color: isPending ? "rgba(255,255,255,.5)" : sc.color, marginTop:3, opacity:.8 }}>
                            {d.toLocaleDateString("fr-FR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}
                            {" · "}
                            {d.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background:"rgba(0,0,0,.1)", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color: isPending ? "#fff" : sc.color }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <div style={{ padding:"18px 24px 24px" }}>
                    {!done ? (<>
                        {/* Statut actuel */}
                        <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:sc.bg, padding:"5px 12px", borderRadius:20, marginBottom:18 }}>
                            <div style={{ width:7, height:7, borderRadius:"50%", background:sc.dot }}/>
                            <span style={{ fontSize:12, fontWeight:700, color:sc.color }}>
                                {{ EN_ATTENTE:"En attente de confirmation", CONFIRMEE:"Confirmée", ANNULEE:"Annulée", EFFECTUEE:"Effectuée" }[visite.statut] ?? visite.statut}
                            </span>
                        </div>

                        {/* Infos bien */}
                        <div style={{ background:"var(--bg)", borderRadius:12, padding:"12px 16px", marginBottom:14 }}>
                            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--text3)", marginBottom:8 }}>Propriété</div>
                            <div style={{ fontSize:14, fontWeight:700, color:"var(--dark)", marginBottom:4 }}>{visite.bien_detail.adresse}</div>
                            {visite.bien_detail.proprietaire_nom && (
                                <div style={{ fontSize:12, color:"var(--text3)" }}>Propriétaire : {visite.bien_detail.proprietaire_nom}</div>
                            )}
                        </div>

                        {/* Infos locataire */}
                        <div style={{ background:"var(--bg)", borderRadius:12, padding:"12px 16px", marginBottom:14 }}>
                            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"var(--text3)", marginBottom:8 }}>Demandeur</div>
                            <div style={{ fontSize:14, fontWeight:700, color:"var(--dark)", marginBottom:4 }}>{visite.locataire_nom ?? "—"}</div>
                            {visite.locataire_email && <div style={{ fontSize:12, color:"var(--text3)" }}>{visite.locataire_email}</div>}
                            {visite.locataire_telephone && <div style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>{visite.locataire_telephone}</div>}
                        </div>

                        {/* Date / heure */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                            <div style={{ background:"var(--bg)", borderRadius:10, padding:"10px 14px" }}>
                                <div style={{ fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--text3)", marginBottom:4 }}>Date</div>
                                <div style={{ fontSize:14, fontWeight:700, color:"var(--dark)" }}>
                                    {d.toLocaleDateString("fr-FR", { day:"2-digit", month:"long" })}
                                </div>
                            </div>
                            <div style={{ background:"var(--bg)", borderRadius:10, padding:"10px 14px" }}>
                                <div style={{ fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--text3)", marginBottom:4 }}>Heure</div>
                                <div style={{ fontSize:14, fontWeight:700, color:"#b8922a" }}>
                                    {d.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}
                                </div>
                            </div>
                        </div>

                        {/* Note du locataire */}
                        {visite.note && (
                            <div style={{ background:"#fffbeb", border:"1px solid #f0d980", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
                                <div style={{ fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"#92400e", marginBottom:5 }}>Message du locataire</div>
                                <div style={{ fontSize:13, color:"#92400e", lineHeight:1.55 }}>{visite.note}</div>
                            </div>
                        )}

                        {/* Zone motif annulation */}
                        {showMotif && (
                            <div style={{ marginBottom:14 }}>
                                <label style={{ fontSize:11, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--text3)", display:"block", marginBottom:5 }}>
                                    Motif du refus (optionnel)
                                </label>
                                <textarea
                                    value={motif}
                                    onChange={e => setMotif(e.target.value)}
                                    placeholder="Ex: Indisponibilité, bien déjà loué…"
                                    rows={3}
                                    style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid var(--border)", fontSize:13, resize:"none", boxSizing:"border-box", outline:"none" }}
                                />
                            </div>
                        )}

                        {/* Actions — uniquement si EN_ATTENTE */}
                        {isPending && (
                            <div style={{ display:"flex", gap:10, marginTop:4 }}>
                                {!showMotif ? (<>
                                    <button
                                        onClick={() => act("confirm")}
                                        disabled={!!loading}
                                        style={{ flex:1, padding:"12px", borderRadius:12, border:"none", background:"#15803d", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", opacity:loading?"0.6":"1", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                                    >
                                        {loading === "confirm"
                                            ? <span style={{ width:15, height:15, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"cal-spin .7s linear infinite" }}/>
                                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                        }
                                        Confirmer la visite
                                    </button>
                                    <button
                                        onClick={() => setShowMotif(true)}
                                        disabled={!!loading}
                                        style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid #c0392b", background:"transparent", color:"#c0392b", fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        Refuser
                                    </button>
                                </>) : (
                                    <>
                                        <button
                                            onClick={() => act("cancel")}
                                            disabled={!!loading}
                                            style={{ flex:1, padding:"12px", borderRadius:12, border:"none", background:"#c0392b", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", opacity:loading?"0.6":"1", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                                        >
                                            {loading === "cancel"
                                                ? <span style={{ width:15, height:15, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"cal-spin .7s linear infinite" }}/>
                                                : "Envoyer le refus"
                                            }
                                        </button>
                                        <button onClick={() => { setShowMotif(false); setMotif("") }} style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid var(--border)", background:"transparent", fontSize:14, fontWeight:600, cursor:"pointer" }}>
                                            Annuler
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Si pas en attente — bouton fermer */}
                        {!isPending && (
                            <button onClick={onClose} style={{ width:"100%", padding:"12px", borderRadius:12, border:"1.5px solid var(--border)", background:"transparent", fontSize:14, fontWeight:600, cursor:"pointer", marginTop:4 }}>
                                Fermer
                            </button>
                        )}
                    </>) : (
                        // ── Feedback succès ──
                        <div style={{ textAlign:"center", padding:"16px 0" }}>
                            <div style={{
                                width:64, height:64, borderRadius:"50%",
                                background: actionDone === "confirm" ? "#f0fdf4" : "#fef2f2",
                                border: `2px solid ${actionDone === "confirm" ? "#bbf7d0" : "#fecaca"}`,
                                display:"flex", alignItems:"center", justifyContent:"center",
                                margin:"0 auto 16px",
                                animation:"cal-pop .4s cubic-bezier(.34,1.56,.64,1)",
                            }}>
                                {actionDone === "confirm"
                                    ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                }
                            </div>
                            <div style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>
                                {actionDone === "confirm" ? "Visite confirmée" : "Visite refusée"}
                            </div>
                            <div style={{ fontSize:13, color:"var(--text3)", marginBottom:20, lineHeight:1.6 }}>
                                {actionDone === "confirm"
                                    ? `Le locataire a été notifié. La visite est planifiée pour le ${d.toLocaleDateString("fr-FR", { weekday:"long", day:"2-digit", month:"long" })} à ${d.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}.`
                                    : "Le locataire a été informé du refus."
                                }
                            </div>
                            <button onClick={onClose} style={{ width:"100%", padding:"12px", borderRadius:12, border:"none", background:"#1a1814", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                                Fermer
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes cal-spin { to{transform:rotate(360deg)} }
                @keyframes cal-pop  { from{transform:scale(.5)} to{transform:scale(1)} }
            `}</style>
        </div>
    )
}

// ── Page principale ───────────────────────────────────────
const Calendar = () => {
    const [visites,       setVisites]       = useState<Visite[]>([])
    const [loading,       setLoading]       = useState(true)
    const [today]       = useState(new Date())
    const [current,       setCurrent]       = useState(new Date())
    const [selected,      setSelected]      = useState<string|null>(null)
    const [activeVisite,  setActiveVisite]  = useState<Visite|null>(null)

    const fetchVisites = () => {
        setLoading(true)
        fetch(`${BASE_URL}/api/locataires/visites/`, { headers: { Authorization: `Bearer ${token()}` } })
            .then(r => r.json())
            .then(d => setVisites(Array.isArray(d) ? d : d.results ?? []))
            .catch(() => setVisites([]))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchVisites() }, [])

    // Mise à jour locale optimiste après action admin
    const handleUpdate = (id: number, newStatut: string) => {
        setVisites(prev => prev.map(v => v.id === id ? { ...v, statut: newStatut } : v))
    }

    const year        = current.getFullYear()
    const month       = current.getMonth()
    const firstDay    = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const visitsByDate = visites.reduce<Record<string, Visite[]>>((acc, v) => {
        const d = v.date_visite.split("T")[0]
        if (!acc[d]) acc[d] = []
        acc[d].push(v)
        return acc
    }, {})

    const selectedVisits = selected ? (visitsByDate[selected] ?? []) : []
    const prevMonth = () => setCurrent(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrent(new Date(year, month + 1, 1))
    const todayStr  = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`
    const mkDate    = (d: number) => `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`

    const upcoming = visites.filter(v => new Date(v.date_visite) >= today && v.statut !== "ANNULEE")
    const pending  = visites.filter(v => v.statut === "EN_ATTENTE")

    return (
        <DashboardLayout navItems={NAV_ITEMS} pageTitle="Calendar">
            <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes popIn  { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
                .cal-anim  { animation: fadeUp .4s cubic-bezier(.4,0,.2,1) both; }
                .event-pop { animation: popIn .25s cubic-bezier(.4,0,.2,1) both; }
                .cal-day-cell { transition: all .15s; }
                .cal-day-cell:hover { background: var(--bg2) !important; transform: scale(1.06); }
                .visite-row:hover { background: var(--bg2) !important; cursor:pointer; }
            `}</style>

            {/* Modale détail + actions */}
            {activeVisite && (
                <VisiteDetailModal
                    visite={activeVisite}
                    onClose={() => setActiveVisite(null)}
                    onUpdate={(id, statut) => {
                        handleUpdate(id, statut)
                        // Ferme la modale après 1.8s pour laisser voir le feedback
                        setTimeout(() => setActiveVisite(null), 1800)
                    }}
                />
            )}

            <div className="pg-header">
                <div>
                    <div className="pg-title">Calendar</div>
                    <div className="pg-subtitle">{visites.length} total visits · {upcoming.length} upcoming</div>
                </div>
                {/* Bouton refresh manuel */}
                <button onClick={fetchVisites} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:10, border:"1.5px solid var(--border)", background:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", color:"var(--text2)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                    Actualiser
                </button>
            </div>

            {/* Bannière visites en attente */}
            {pending.length > 0 && (
                <div style={{ background:"#fffbeb", border:"1px solid #f0d980", borderRadius:14, padding:"12px 18px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:"#fef3c7", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8922a" strokeWidth="2"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                        </div>
                        <div>
                            <div style={{ fontSize:13, fontWeight:700, color:"#92400e" }}>{pending.length} visite{pending.length > 1 ? "s" : ""} en attente de validation</div>
                            <div style={{ fontSize:12, color:"#b45309" }}>Cliquez sur une visite pour confirmer ou refuser</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
                {[
                    { label:"Total Visits",  value:visites.length,  color:"#1d4ed8", bg:"#eff6ff" },
                    { label:"Upcoming",      value:upcoming.length, color:"#15803d", bg:"#f0fdf4" },
                    { label:"Pending",       value:pending.length,  color:"#b8922a", bg:"#fdf6e7" },
                    { label:"This Month",    value:visites.filter(v => new Date(v.date_visite).getMonth() === month).length, color:"#7c3aed", bg:"#f5f3ff" },
                ].map((s, i) => (
                    <div key={s.label} className="stat-card cal-anim" style={{ animationDelay:`${i*70}ms` }}>
                        <div className="stat-icon-wrap" style={{ background:s.bg }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                            </svg>
                        </div>
                        <div className="stat-body">
                            <span className="stat-label">{s.label}</span>
                            <span className="stat-value" style={{ color:s.color }}>{s.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:16 }}>
                {/* Calendrier */}
                <div className="card cal-anim" style={{ animationDelay:"200ms" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                        <div style={{ fontSize:18, fontWeight:700 }}>
                            {MONTHS[month]} <span style={{ color:"var(--text3)", fontWeight:400 }}>{year}</span>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                            <button onClick={prevMonth} style={{ width:34, height:34, borderRadius:"50%", border:"1px solid var(--border)", background:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
                                    onMouseEnter={e => (e.currentTarget.style.background="var(--bg)")} onMouseLeave={e => (e.currentTarget.style.background="none")}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                            </button>
                            <button onClick={() => setCurrent(new Date())} style={{ padding:"6px 14px", borderRadius:20, border:"1px solid var(--border)", background:"none", cursor:"pointer", fontSize:12, fontWeight:500 }}>
                                Today
                            </button>
                            <button onClick={nextMonth} style={{ width:34, height:34, borderRadius:"50%", border:"1px solid var(--border)", background:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
                                    onMouseEnter={e => (e.currentTarget.style.background="var(--bg)")} onMouseLeave={e => (e.currentTarget.style.background="none")}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                            </button>
                        </div>
                    </div>

                    {/* Jours */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:8 }}>
                        {DAYS.map(d => (
                            <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:600, color:"var(--text3)", padding:"4px 0", textTransform:"uppercase", letterSpacing:".5px" }}>{d}</div>
                        ))}
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
                        {Array.from({ length:firstDay }).map((_,i) => <div key={`e${i}`}/>)}
                        {Array.from({ length:daysInMonth }).map((_,i) => {
                            const d         = i + 1
                            const dateStr   = mkDate(d)
                            const dayVisits = visitsByDate[dateStr] ?? []
                            const isToday   = dateStr === todayStr
                            const isSel     = dateStr === selected
                            const hasPend   = dayVisits.some(v => v.statut === "EN_ATTENTE")
                            return (
                                <div key={d} className="cal-day-cell"
                                     onClick={() => setSelected(isSel ? null : dateStr)}
                                     style={{
                                         aspectRatio:"1", borderRadius:10, padding:4, cursor:"pointer",
                                         background: isToday ? "#b8922a" : isSel ? "#fdf6e7" : "transparent",
                                         border: hasPend && !isToday ? "2px solid #f0d980" : isSel && !isToday ? "1.5px solid #b8922a" : "1.5px solid transparent",
                                         display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start",
                                         position:"relative",
                                     }}>
                                    <span style={{ fontSize:13, fontWeight:isToday?800:500, color:isToday?"#fff":"var(--text)", lineHeight:1.6 }}>{d}</span>
                                    {dayVisits.length > 0 && (
                                        <div style={{ display:"flex", gap:2, flexWrap:"wrap", justifyContent:"center" }}>
                                            {dayVisits.slice(0,3).map((v,vi) => (
                                                <div key={vi} style={{ width:6, height:6, borderRadius:"50%", background:STATUT_COLOR[v.statut]?.dot ?? "#b8922a" }}/>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Légende */}
                    <div style={{ display:"flex", gap:16, marginTop:20, paddingTop:16, borderTop:"1px solid var(--border)" }}>
                        {Object.entries(STATUT_COLOR).map(([k,v]) => (
                            <div key={k} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text3)" }}>
                                <div style={{ width:8, height:8, borderRadius:"50%", background:v.dot }}/>
                                {{ EN_ATTENTE:"Pending", CONFIRMEE:"Confirmed", ANNULEE:"Cancelled", EFFECTUEE:"Completed" }[k]}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Panneau latéral */}
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                    {/* Jour sélectionné */}
                    {selected && (
                        <div className="card event-pop">
                            <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>
                                {new Date(selected+"T12:00:00").toLocaleDateString("fr-FR", { weekday:"long", month:"long", day:"numeric" })}
                            </div>
                            {selectedVisits.length === 0
                                ? <div style={{ fontSize:13, color:"var(--text3)", textAlign:"center", padding:"16px 0" }}>Aucune visite ce jour</div>
                                : selectedVisits.map(v => {
                                    const sc = STATUT_COLOR[v.statut] ?? STATUT_COLOR.EN_ATTENTE
                                    const isPend = v.statut === "EN_ATTENTE"
                                    return (
                                        <div key={v.id} className="visite-row"
                                             onClick={() => setActiveVisite(v)}
                                             style={{ display:"flex", gap:12, padding:"12px", borderRadius:10, background:sc.bg, marginBottom:8, border:`1px solid ${sc.dot}22`, cursor:"pointer", transition:"all .15s" }}>
                                            <div style={{ width:3, borderRadius:2, background:sc.dot, flexShrink:0 }}/>
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                                                    <div style={{ fontSize:13, fontWeight:600 }}>{v.bien_detail.adresse}</div>
                                                    {isPend && (
                                                        <span style={{ fontSize:9, fontWeight:700, background:"#b8922a", color:"#fff", padding:"2px 7px", borderRadius:20, flexShrink:0 }}>À VALIDER</span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>
                                                    {new Date(v.date_visite).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}
                                                    {v.locataire_nom && ` · ${v.locataire_nom}`}
                                                </div>
                                                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:6 }}>
                                                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:"#fff", color:sc.color }}>
                                                        {{ EN_ATTENTE:"En attente", CONFIRMEE:"Confirmée", ANNULEE:"Annulée", EFFECTUEE:"Effectuée" }[v.statut]}
                                                    </span>
                                                    <span style={{ fontSize:11, color:sc.color, fontWeight:600 }}>
                                                        {isPend ? "Cliquer pour décider →" : "Voir détail →"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    )}

                    {/* Visites à venir */}
                    <div className="card cal-anim" style={{ animationDelay:"300ms" }}>
                        <div className="card-hd">
                            <div className="card-title">Upcoming Visits</div>
                            <span style={{ fontSize:12, color:"var(--gold)", fontWeight:600 }}>{upcoming.length}</span>
                        </div>
                        {loading && <div style={{ fontSize:13, color:"var(--text3)", textAlign:"center", padding:16 }}>Loading…</div>}
                        {!loading && upcoming.length === 0 && (
                            <div style={{ fontSize:13, color:"var(--text3)", textAlign:"center", padding:16 }}>No upcoming visits</div>
                        )}
                        <div style={{ display:"flex", flexDirection:"column" }}>
                            {upcoming.slice(0,6).map(v => {
                                const sc   = STATUT_COLOR[v.statut]
                                const d    = new Date(v.date_visite)
                                const isPend = v.statut === "EN_ATTENTE"
                                return (
                                    <div key={v.id} className="visite-row"
                                         onClick={() => setActiveVisite(v)}
                                         style={{ display:"flex", gap:10, alignItems:"center", padding:"10px 0", borderBottom:"1px solid var(--border)", transition:"background .15s", borderRadius:6 }}>
                                        <div style={{ width:42, height:42, borderRadius:10, flexShrink:0, background:"var(--gold-bg)", border:"1px solid rgba(184,146,42,0.2)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                                            <span style={{ fontSize:16, fontWeight:800, color:"var(--gold)", lineHeight:1 }}>{d.getDate()}</span>
                                            <span style={{ fontSize:9, color:"var(--gold)", textTransform:"uppercase" }}>{MONTHS[d.getMonth()].slice(0,3)}</span>
                                        </div>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.bien_detail.adresse}</div>
                                            <div style={{ fontSize:11, color:"var(--text3)" }}>{d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div>
                                        </div>
                                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                                            <div style={{ width:8, height:8, borderRadius:"50%", background:sc?.dot ?? "#b8922a" }}/>
                                            {isPend && (
                                                <span style={{ fontSize:9, fontWeight:800, background:"#fdf6e7", color:"#b8922a", padding:"1px 6px", borderRadius:20 }}>PENDING</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default Calendar