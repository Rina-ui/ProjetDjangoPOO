import { useState, useMemo } from "react"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, RadarChart,
    PolarGrid, PolarAngleAxis, Radar
} from "recharts"
import "../style/investment.css"

// ── TYPES ─────────────────────────────────────────────────────────
interface Props {
    propertyName?:  string   // Nom de la propriété
    propertyPrice?: number   // Prix d'achat estimé de base
}

// Facteurs d'évaluation — chaque facteur a un score de 1 à 5
interface Facteurs {
    quartier:   number   // Qualité / attractivité du quartier
    etat:       number   // État général du bien
    marche:     number   // Dynamisme du marché local
    demande:    number   // Demande locative dans la zone
    rentabilite:number   // Potentiel de rentabilité locative
}

// ── CONSTANTES ────────────────────────────────────────────────────
new Date().getFullYear();
// Labels des facteurs (affichés dans le radar et les sliders)
const LABELS_FACTEURS: Record<keyof Facteurs, string> = {
    quartier:    "Qualité du quartier",
    etat:        "État du bien",
    marche:      "Dynamisme marché",
    demande:     "Demande locative",
    rentabilite: "Rentabilité locative",
}

// Multiplicateurs de prix par score de quartier (1=faible, 5=premium)
const MULT_QUARTIER = [0.75, 0.88, 1.0, 1.18, 1.40]

// Taux de valorisation annuelle selon le score de marché
const TAUX_VALORISATION = [0.02, 0.035, 0.05, 0.07, 0.09]

// Rendement locatif brut annuel selon la demande (% du prix)
const RENDEMENT_LOCATIF = [0.04, 0.055, 0.07, 0.085, 0.10]

// ── CALCULS ───────────────────────────────────────────────────────

/**
 * Calcule le prix de vente recommandé selon les facteurs
 */
const calculerPrixVente = (base: number, f: Facteurs): number => {
    const multQuartier = MULT_QUARTIER[f.quartier - 1]
    const multEtat     = 0.7 + (f.etat - 1) * 0.075      // 0.70 à 1.0
    const multMarche   = 0.9 + (f.marche - 1) * 0.05     // 0.90 à 1.1
    return Math.round(base * multQuartier * multEtat * multMarche)
}

/**
 * Calcule le loyer mensuel recommandé
 */
const calculerLoyer = (prixVente: number, f: Facteurs): number => {
    const rendement = RENDEMENT_LOCATIF[f.demande - 1]
    const multRenta = 0.85 + (f.rentabilite - 1) * 0.075
    return Math.round((prixVente * rendement * multRenta) / 12)
}

/**
 * Génère le score final "Vendre vs Louer" (0-100 pour chaque option)
 */
const calculerVerdict = (f: Facteurs): { scoreVente: number; scoreLocation: number } => {
    // Score vente : favorisé par bon marché + bon état
    const scoreVente = Math.round(
        (f.marche * 25) +
        (f.etat * 15) +
        ((6 - f.demande) * 5) +  // marché moins locatif = mieux vendre
        (f.quartier * 10) - 10
    )

    // Score location : favorisé par forte demande + bonne rentabilité
    const scoreLocation = Math.round(
        (f.demande * 25) +
        (f.rentabilite * 20) +
        ((6 - f.marche) * 5) +   // marché moins dynamique = mieux louer
        (f.quartier * 5) - 5
    )

    return {
        scoreVente:    Math.min(100, Math.max(0, scoreVente)),
        scoreLocation: Math.min(100, Math.max(0, scoreLocation)),
    }
}

/**
 * Génère les données de projection sur N années
 */
const genererProjection = (prixVente: number, loyer: number, f: Facteurs, annees: number) => {
    const taux = TAUX_VALORISATION[f.marche - 1]
    const points = []

    let cumulLoyers  = 0
    let loyerActuel  = loyer

    for (let a = 0; a <= annees; a++) {
        const valeur = Math.round(prixVente * Math.pow(1 + taux, a))
        if (a > 0) {
            cumulLoyers += loyerActuel * 12
            loyerActuel  = Math.round(loyerActuel * 1.03) // +3%/an
        }
        points.push({
            label:       a === 0 ? "Auj." : `+${a}a`,
            valeurBien:  valeur,
            cumulLoyers: Math.round(cumulLoyers),
            totalLouer:  Math.round(cumulLoyers + prixVente), // valeur récupérable si on loue puis revend
        })
    }
    return points
}

// ── HELPER ────────────────────────────────────────────────────────
const fmt = (n: number): string => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
    return `$${n}`
}

const fmtLoyer = (n: number): string => `$${n.toLocaleString()}/mo`

// ── COMPOSANT ─────────────────────────────────────────────────────
const InvestmentTimeline = ({
                                propertyName  = "Votre propriété",
                                propertyPrice = 500_000,
                            }: Props) => {

    // État : valeur de base du bien (modifiable par le propriétaire)
    const [prixBase, setPrixBase] = useState(propertyPrice)

    // État : les 5 facteurs d'évaluation
    const [facteurs, setFacteurs] = useState<Facteurs>({
        quartier:    3,
        etat:        3,
        marche:      3,
        demande:     3,
        rentabilite: 3,
    })

    // Horizon de simulation
    const [horizon, setHorizon] = useState<5 | 10 | 15 | 20>(10)

    // Vue graphique
    const [vue, setVue] = useState<"projection" | "radar">("projection")

    // Modifier un facteur
    const setFacteur = (key: keyof Facteurs, val: number) => {
        setFacteurs(prev => ({ ...prev, [key]: val }))
    }

    // Calculs mémoïsés
    const prixVente   = useMemo(() => calculerPrixVente(prixBase, facteurs), [prixBase, facteurs])
    const loyer       = useMemo(() => calculerLoyer(prixVente, facteurs),    [prixVente, facteurs])
    const verdict     = useMemo(() => calculerVerdict(facteurs),             [facteurs])
    const projection  = useMemo(() => genererProjection(prixVente, loyer, facteurs, horizon), [prixVente, loyer, facteurs, horizon])

    // Données radar
    const radarData = Object.entries(LABELS_FACTEURS).map(([key, label]) => ({
        facteur: label.split(" ")[0], // Mot court pour le radar
        score:   facteurs[key as keyof Facteurs],
        max:     5,
    }))

    // Verdict final
    const recommande = verdict.scoreVente >= verdict.scoreLocation ? "vendre" : "louer"
    const ecart      = Math.abs(verdict.scoreVente - verdict.scoreLocation)
    const confidence = ecart > 20 ? "fortement" : ecart > 10 ? "légèrement" : "légèrement"

    return (
        <div className="itl-wrap">

            {/* ── EN-TÊTE ─────────────────────────────────────── */}
            <div className="itl-header">
                <div>
                    <div className="itl-title">Analyser : Vendre ou Louer ?</div>
                    <div className="itl-sub">{propertyName} · Recommandation basée sur vos facteurs</div>
                </div>
                <div className="itl-view-toggle">
                    <button className={`itl-view-btn ${vue === "projection" ? "active" : ""}`} onClick={() => setVue("projection")}>
                        Projection
                    </button>
                    <button className={`itl-view-btn ${vue === "radar" ? "active" : ""}`} onClick={() => setVue("radar")}>
                        Analyse facteurs
                    </button>
                </div>
            </div>

            {/* ── VERDICT ─────────────────────────────────────── */}
            <div className={`itl-verdict ${recommande === "vendre" ? "itl-verdict--vendre" : "itl-verdict--louer"}`}>
                <div className="itl-verdict-icon">
                    {recommande === "vendre" ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                        </svg>
                    ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                    )}
                </div>
                <div className="itl-verdict-text">
                    <div className="itl-verdict-title">
                        Recommandation : <strong>{recommande === "vendre" ? "Vendre" : "Louer"}</strong>
                    </div>
                    <div className="itl-verdict-sub">
                        Selon vos facteurs, il est {confidence} plus avantageux de {recommande === "vendre" ? "vendre maintenant" : "mettre en location"}
                    </div>
                </div>
                <div className="itl-verdict-scores">
                    <div className={`itl-score ${recommande === "vendre" ? "active" : ""}`}>
                        <span className="itl-score-num">{verdict.scoreVente}</span>
                        <span className="itl-score-lbl">Vente</span>
                    </div>
                    <div className="itl-score-sep">vs</div>
                    <div className={`itl-score ${recommande === "louer" ? "active" : ""}`}>
                        <span className="itl-score-num">{verdict.scoreLocation}</span>
                        <span className="itl-score-lbl">Location</span>
                    </div>
                </div>
            </div>

            {/* ── PRIX RECOMMANDÉS ─────────────────────────────── */}
            <div className="itl-prix">
                <div className="itl-prix-card itl-prix--vente">
                    <div className="itl-prix-lbl">Prix de vente recommandé</div>
                    <div className="itl-prix-val">{fmt(prixVente)}</div>
                    <div className="itl-prix-diff">
                        {prixVente > prixBase
                            ? `+${fmt(prixVente - prixBase)} vs prix de base`
                            : `-${fmt(prixBase - prixVente)} vs prix de base`}
                    </div>
                </div>
                <div className="itl-prix-card itl-prix--loyer">
                    <div className="itl-prix-lbl">Loyer mensuel recommandé</div>
                    <div className="itl-prix-val">{fmtLoyer(loyer)}</div>
                    <div className="itl-prix-diff">
                        Rendement {((loyer * 12 / prixVente) * 100).toFixed(1)}% brut/an
                    </div>
                </div>
                {/* Prix de base modifiable */}
                <div className="itl-prix-card itl-prix--base">
                    <div className="itl-prix-lbl">Prix de base du bien</div>
                    <input
                        type="number"
                        className="itl-prix-input"
                        value={prixBase}
                        onChange={e => setPrixBase(Number(e.target.value))}
                        step={5000}
                    />
                    <div className="itl-prix-diff">Modifiable</div>
                </div>
            </div>

            {/* ── FACTEURS ─────────────────────────────────────── */}
            <div className="itl-facteurs">
                <div className="itl-facteurs-title">Ajustez les facteurs de votre bien</div>
                <div className="itl-facteurs-grid">
                    {(Object.keys(facteurs) as (keyof Facteurs)[]).map(key => (
                        <div className="itl-facteur-row" key={key}>
                            <div className="itl-facteur-label">{LABELS_FACTEURS[key]}</div>
                            <div className="itl-facteur-stars">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button
                                        key={n}
                                        className={`itl-star ${facteurs[key] >= n ? "active" : ""}`}
                                        onClick={() => setFacteur(key, n)}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <div className="itl-facteur-score">{facteurs[key]}/5</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── GRAPHIQUE ───────────────────────────────────── */}
            <div className="itl-chart">
                {vue === "projection" ? (
                    <>
                        <div className="itl-chart-title">
                            Évolution sur {horizon} ans — Vendre maintenant vs Louer puis vendre
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={projection} margin={{ top:8, right:8, left:0, bottom:0 }}>
                                <defs>
                                    <linearGradient id="gVente" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="var(--gold)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--gold)" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="gLouer" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="var(--green)" stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor="var(--green)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--itl-chart-grid)" strokeOpacity={0.6}/>
                                <XAxis dataKey="label" tick={{ fontSize:11, fill:"var(--itl-chart-tick)" }} axisLine={false} tickLine={false}/>
                                <YAxis tickFormatter={(v: any) => fmt(Number(v))} tick={{ fontSize:10, fill:"var(--itl-chart-tick)" }} axisLine={false} tickLine={false} width={62}/>
                                <Tooltip
                                    formatter={(v: any, name: any) => [
                                        fmt(Number(v)),
                                        name === "valeurBien" ? "Valeur si vendu" : "Revenus loyers cumulés"
                                    ] as [string, string]}
                                    contentStyle={{ background:"var(--itl-tooltip-bg)", border:"1px solid var(--itl-tooltip-border)", borderRadius:10, fontSize:12, color:"var(--text)" }}
                                />
                                <Area type="monotone" dataKey="valeurBien"  stroke="var(--gold)" strokeWidth={2} fill="url(#gVente)" dot={false} name="valeurBien"/>
                                <Area type="monotone" dataKey="cumulLoyers" stroke="var(--green)" strokeWidth={2} fill="url(#gLouer)" dot={false} strokeDasharray="5 5" name="cumulLoyers"/>
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="itl-legend">
                            <span className="itl-leg itl-leg--gold">— Valeur du bien (vente)</span>
                            <span className="itl-leg itl-leg--green">- - Loyers cumulés (location)</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="itl-chart-title">Analyse multicritère de votre bien</div>
                        <ResponsiveContainer width="100%" height={220}>
                            <RadarChart data={radarData} margin={{ top:8, right:30, left:30, bottom:8 }}>
                                <PolarGrid stroke="var(--itl-chart-grid)"/>
                                <PolarAngleAxis dataKey="facteur" tick={{ fontSize:11, fill:"var(--itl-chart-tick)" }}/>
                                <Radar name="Score" dataKey="score" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.25}/>
                            </RadarChart>
                        </ResponsiveContainer>
                    </>
                )}
            </div>

            {/* ── HORIZON ─────────────────────────────────────── */}
            <div className="itl-horizon">
                <span className="itl-horizon-lbl">Horizon :</span>
                {([5, 10, 15, 20] as const).map(y => (
                    <button key={y} className={`itl-horizon-btn ${horizon === y ? "active" : ""}`} onClick={() => setHorizon(y)}>
                        {y} ans
                    </button>
                ))}
            </div>

            <p className="itl-note">
                Estimation basée sur les facteurs sélectionnés. Les prix et rendements sont indicatifs
                et dépendent du marché local réel. Consultez un agent KÔRÂ pour une évaluation précise.
            </p>
        </div>
    )
}

export default InvestmentTimeline