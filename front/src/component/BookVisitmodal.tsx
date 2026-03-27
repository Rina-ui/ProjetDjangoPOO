import { useState } from "react"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

interface Props {
    prop: {
        id:               number
        address:          string
        loyer_hc?:        number
        charges?:         number
        proprietaire_nom?: string
        agent?:           string
        beds?:            number
        baths?:           number
        sqft?:            string | number
        status?:          string
        img?:             string
    }
    tenant?: {
        firstname?: string
        lastname?:  string
        email?:     string
        phone?:     string
    }
    onClose:   () => void
    onSuccess: () => void
}

// ── Génération PDF dynamique côté client ──────────────────
const generateVisitPDF = (data: {
    bien:       Props["prop"]
    tenant:     Props["tenant"]
    date:       string
    note:       string
    refNumber:  string
}) => {
    const { bien, tenant, date, note, refNumber } = data
    const d = new Date(date)
    const dateStr  = d.toLocaleDateString("fr-FR",  { weekday:"long",  day:"2-digit", month:"long",  year:"numeric" })
    const heureStr = d.toLocaleTimeString("fr-FR",  { hour:"2-digit",  minute:"2-digit" })
    const genDate  = new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" })
    const tenantName = `${tenant?.firstname ?? ""} ${tenant?.lastname ?? ""}`.trim() || "N/D"
    const loyer = bien.loyer_hc ? `${bien.loyer_hc.toLocaleString()} XOF/mois` : "N/D"

    // HTML converti en blob puis ouvert dans un nouvel onglet pour impression/sauvegarde
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Demande de visite — ${refNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DM Sans',sans-serif;color:#1a1814;background:#f5f3ef;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px}
  .page{background:#fff;width:700px;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.12)}
  /* Header */
  .hd{background:#1a1814;padding:32px 40px;position:relative;overflow:hidden}
  .hd::before{content:"";position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(184,146,42,.12)}
  .hd-top{display:flex;justify-content:space-between;align-items:flex-start}
  .logo{font-size:22px;font-weight:800;color:#f0d980;letter-spacing:-.03em}
  .logo span{color:rgba(255,255,255,.45);font-weight:300}
  .ref{font-size:11px;font-weight:600;color:rgba(255,255,255,.45);letter-spacing:.1em;text-align:right}
  .ref strong{display:block;font-size:14px;font-weight:700;color:#f0d980;margin-top:2px}
  .hd-title{margin-top:24px;font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em}
  .hd-sub{font-size:13px;color:rgba(255,255,255,.5);margin-top:4px}
  /* Status bar */
  .status-bar{background:#b8922a;padding:10px 40px;display:flex;align-items:center;gap:10px}
  .status-dot{width:8px;height:8px;border-radius:50%;background:#fff;opacity:.8}
  .status-text{font-size:12px;font-weight:700;color:#fff;letter-spacing:.06em;text-transform:uppercase}
  .status-date{margin-left:auto;font-size:12px;color:rgba(255,255,255,.75)}
  /* Body */
  .body{padding:36px 40px}
  /* Section */
  .section{margin-bottom:28px}
  .section-title{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#b8922a;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #f0d980}
  /* Grid rows */
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .field{background:#f7f5f1;border-radius:10px;padding:12px 16px}
  .field.full{grid-column:1/-1}
  .field-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#8a8278;margin-bottom:4px}
  .field-value{font-size:14px;font-weight:600;color:#1a1814}
  .field-value.accent{color:#b8922a;font-weight:700}
  /* Timeline */
  .timeline{display:flex;gap:0;margin-bottom:28px}
  .tl-step{flex:1;display:flex;flex-direction:column;align-items:center;position:relative}
  .tl-step::after{content:"";position:absolute;top:14px;left:50%;width:100%;height:2px;background:#e8e2d8;z-index:0}
  .tl-step:last-child::after{display:none}
  .tl-circle{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;position:relative;z-index:1;border:2px solid #e8e2d8;background:#fff;color:#8a8278}
  .tl-circle.done{background:#b8922a;border-color:#b8922a;color:#fff}
  .tl-circle.active{background:#1a1814;border-color:#1a1814;color:#fff}
  .tl-label{font-size:10px;color:#8a8278;margin-top:6px;text-align:center;font-weight:500}
  .tl-label.active{color:#1a1814;font-weight:700}
  /* Note */
  .note-box{background:#fffbeb;border:1px solid #f0d980;border-radius:10px;padding:14px 16px;font-size:13px;color:#92400e;line-height:1.6}
  /* Footer */
  .footer{background:#f7f5f1;padding:20px 40px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e8e2d8}
  .footer-left{font-size:11px;color:#8a8278;line-height:1.7}
  .footer-right{text-align:right;font-size:11px;color:#8a8278}
  .footer-brand{font-size:13px;font-weight:800;color:#1a1814;letter-spacing:-.01em}
  /* Print */
  @media print{
    body{background:#fff;padding:0}
    .page{box-shadow:none;border-radius:0;width:100%}
    .print-btn{display:none!important}
  }
  .print-btn{display:block;width:100%;padding:14px;background:#1a1814;color:#fff;border:none;border-radius:0 0 16px 16px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:.02em}
  .print-btn:hover{background:#b8922a}
</style>
</head>
<body>
<div class="page">

  <div class="hd">
    <div class="hd-top">
      <div class="logo">KÔR<span>Â</span></div>
      <div class="ref">
        Référence demande
        <strong>${refNumber}</strong>
      </div>
    </div>
    <div class="hd-title">Demande de visite</div>
    <div class="hd-sub">Plateforme immobilière KÔRÂ · Togo</div>
  </div>

  <div class="status-bar">
    <div class="status-dot"></div>
    <div class="status-text">En attente de confirmation</div>
    <div class="status-date">Soumise le ${genDate}</div>
  </div>

  <div class="body">

    <!-- Parcours -->
    <div class="section">
      <div class="section-title">Statut de la demande</div>
      <div class="timeline">
        <div class="tl-step">
          <div class="tl-circle done">1</div>
          <div class="tl-label active">Demande soumise</div>
        </div>
        <div class="tl-step">
          <div class="tl-circle active">2</div>
          <div class="tl-label active">En attente admin</div>
        </div>
        <div class="tl-step">
          <div class="tl-circle">3</div>
          <div class="tl-label">Confirmée</div>
        </div>
        <div class="tl-step">
          <div class="tl-circle">4</div>
          <div class="tl-label">Visite effectuée</div>
        </div>
      </div>
    </div>

    <!-- Bien -->
    <div class="section">
      <div class="section-title">Propriété concernée</div>
      <div class="grid">
        <div class="field full">
          <div class="field-label">Adresse</div>
          <div class="field-value accent">${bien.address}</div>
        </div>
        <div class="field">
          <div class="field-label">Loyer mensuel</div>
          <div class="field-value">${loyer}</div>
        </div>
        <div class="field">
          <div class="field-label">Propriétaire</div>
          <div class="field-value">${bien.proprietaire_nom ?? bien.agent ?? "N/D"}</div>
        </div>
        ${bien.beds ? `<div class="field"><div class="field-label">Chambres</div><div class="field-value">${bien.beds}</div></div>` : ""}
        ${bien.baths ? `<div class="field"><div class="field-label">Salles de bain</div><div class="field-value">${bien.baths}</div></div>` : ""}
        ${bien.sqft ? `<div class="field"><div class="field-label">Superficie</div><div class="field-value">${bien.sqft} m²</div></div>` : ""}
        <div class="field">
          <div class="field-label">Statut</div>
          <div class="field-value">${bien.status === "For Rent" ? "À louer" : "À vendre"}</div>
        </div>
      </div>
    </div>

    <!-- Demandeur -->
    <div class="section">
      <div class="section-title">Demandeur</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Nom complet</div>
          <div class="field-value">${tenantName}</div>
        </div>
        <div class="field">
          <div class="field-label">Email</div>
          <div class="field-value">${tenant?.email ?? "N/D"}</div>
        </div>
        <div class="field">
          <div class="field-label">Téléphone</div>
          <div class="field-value">${tenant?.phone ?? "N/D"}</div>
        </div>
        <div class="field">
          <div class="field-label">Type</div>
          <div class="field-value">Locataire KÔRÂ</div>
        </div>
      </div>
    </div>

    <!-- Date de visite -->
    <div class="section">
      <div class="section-title">Date et heure souhaitées</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Date</div>
          <div class="field-value accent">${dateStr}</div>
        </div>
        <div class="field">
          <div class="field-label">Heure</div>
          <div class="field-value accent">${heureStr}</div>
        </div>
      </div>
    </div>

    ${note.trim() ? `
    <!-- Note -->
    <div class="section">
      <div class="section-title">Message du demandeur</div>
      <div class="note-box">${note.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
    </div>
    ` : ""}

  </div>

  <div class="footer">
    <div class="footer-left">
      Ce document est généré automatiquement par la plateforme KÔRÂ.<br/>
      Il ne constitue pas un contrat. La visite est soumise à confirmation par l'agence.
    </div>
    <div class="footer-right">
      <div class="footer-brand">KÔRÂ</div>
      Plateforme immobilière · Togo
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">Imprimer / Enregistrer en PDF</button>
</div>
</body>
</html>`

    const blob = new Blob([html], { type: "text/html;charset=utf-8" })
    const url  = URL.createObjectURL(blob)
    const win  = window.open(url, "_blank")
    if (win) win.focus()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
}

// ── Composant modal ───────────────────────────────────────
export const BookVisitModal = ({ prop, tenant, onClose, onSuccess }: Props) => {
    const [date,    setDate]    = useState("")
    const [note,    setNote]    = useState("")
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState("")
    const [done,    setDone]    = useState(false)
    const [refNum,  setRefNum]  = useState("")

    const submit = async () => {
        if (!date) { setError("Choisissez une date et heure"); return }
        if (new Date(date) <= new Date()) { setError("La date doit être dans le futur"); return }
        setLoading(true); setError("")

        try {
            const token = localStorage.getItem("access_token")

            // 1. Créer la visite → apparaît immédiatement dans /api/locataires/visites/
            //    que l'admin lit dans son Calendar
            const res = await fetch(`${BASE_URL}/api/locataires/visites/`, {
                method:  "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body:    JSON.stringify({
                    bien:        prop.id,
                    date_visite: date,
                    note,
                    // statut EN_ATTENTE par défaut côté Django
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.detail ?? JSON.stringify(err))
            }

            const data = await res.json()
            const ref  = `VIS-${data.id ?? Date.now()}-${prop.id}`
            setRefNum(ref)

            // 2. Notifier admin (notification push si endpoint dispo)
            fetch(`${BASE_URL}/api/notifications/admin/visite/`, {
                method:  "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body:    JSON.stringify({
                    visite_id:    data.id,
                    bien_id:      prop.id,
                    bien_adresse: prop.address,
                    date_visite:  date,
                    locataire:    `${tenant?.firstname ?? ""} ${tenant?.lastname ?? ""}`.trim(),
                }),
            }).catch(() => {}) // Silencieux si endpoint pas encore créé

            setDone(true)
            onSuccess()
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const downloadDoc = () => {
        generateVisitPDF({ bien: prop, tenant, date, note, refNumber: refNum })
    }

    const is: React.CSSProperties = {
        width: "100%", padding: "10px 12px", borderRadius: 10,
        border: "1.5px solid var(--border)", fontSize: 14,
        outline: "none", boxSizing: "border-box",
        background: "var(--bg)", color: "var(--text)",
    }

    return (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.52)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, backdropFilter:"blur(3px)" }}>
            <div style={{ background:"#fff", borderRadius:22, width:460, boxShadow:"0 28px 72px rgba(0,0,0,.22)", overflow:"hidden" }}>

                {/* Header */}
                <div style={{ background:"#1a1814", padding:"22px 24px", display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                    <div>
                        <div style={{ fontSize:17, fontWeight:800, color:"#fff" }}>Réserver une visite</div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,.45)", marginTop:3, maxWidth:320, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{prop.address}</div>
                    </div>
                    <button onClick={onClose} style={{ background:"rgba(255,255,255,.1)", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", color:"rgba(255,255,255,.7)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <div style={{ padding:"20px 24px 24px" }}>
                    {!done ? (<>
                        <div style={{ marginBottom:14 }}>
                            <label style={{ fontSize:11, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--text3)", display:"block", marginBottom:5 }}>Date et heure *</label>
                            <input
                                type="datetime-local"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                min={new Date(Date.now() + 3600000).toISOString().slice(0,16)}
                                style={is}
                            />
                        </div>

                        <div style={{ marginBottom:18 }}>
                            <label style={{ fontSize:11, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", color:"var(--text3)", display:"block", marginBottom:5 }}>Message (optionnel)</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Questions, préférences horaires, remarques…"
                                rows={3}
                                style={{ ...is, resize:"none" } as React.CSSProperties}
                            />
                        </div>

                        {/* Info */}
                        <div style={{ background:"var(--bg)", borderRadius:10, padding:"10px 14px", marginBottom:18, fontSize:12, color:"var(--text3)", lineHeight:1.6 }}>
                            Votre demande sera envoyée à l'administration KÔRÂ. Un document officiel sera généré après confirmation.
                        </div>

                        {error && (
                            <div style={{ fontSize:12, color:"#c0392b", background:"#fef2f2", borderRadius:8, padding:"8px 12px", marginBottom:14 }}>{error}</div>
                        )}

                        <div style={{ display:"flex", gap:10 }}>
                            <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid var(--border)", background:"transparent", fontSize:14, fontWeight:600, cursor:"pointer" }}>
                                Annuler
                            </button>
                            <button onClick={submit} disabled={loading} style={{ flex:1, padding:"12px", borderRadius:12, border:"none", background:"#1a1814", color:"#fff", fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.6:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                                {loading
                                    ? <span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"bv-spin .7s linear infinite" }}/>
                                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                }
                                {loading ? "Envoi…" : "Confirmer la demande"}
                            </button>
                        </div>
                    </>) : (
                        // ── SUCCÈS ──
                        <div style={{ textAlign:"center", padding:"12px 0" }}>
                            <div style={{ width:64, height:64, borderRadius:"50%", background:"#f0fdf4", border:"2px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", animation:"bv-pop .4s cubic-bezier(.34,1.56,.64,1)" }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <div style={{ fontSize:17, fontWeight:800, marginBottom:5 }}>Demande envoyée</div>
                            <div style={{ fontSize:13, color:"var(--text3)", lineHeight:1.6, marginBottom:6 }}>
                                L'administration KÔRÂ a été notifiée et va confirmer votre visite.
                            </div>
                            {refNum && (
                                <div style={{ fontSize:11, fontFamily:"monospace", background:"var(--bg2)", padding:"4px 12px", borderRadius:6, display:"inline-block", color:"var(--text3)", marginBottom:20 }}>
                                    Réf: {refNum}
                                </div>
                            )}

                            {/* Télécharger le document */}
                            <button
                                onClick={downloadDoc}
                                style={{ width:"100%", padding:"12px", borderRadius:12, border:"none", background:"#b8922a", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:10 }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Télécharger le document officiel
                            </button>

                            <button onClick={onClose} style={{ width:"100%", padding:"12px", borderRadius:12, border:"1.5px solid var(--border)", background:"transparent", fontSize:14, fontWeight:600, cursor:"pointer" }}>
                                Fermer
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes bv-spin { to{transform:rotate(360deg)} }
                @keyframes bv-pop  { from{transform:scale(.5)} to{transform:scale(1)} }
            `}</style>
        </div>
    )
}

export default BookVisitModal