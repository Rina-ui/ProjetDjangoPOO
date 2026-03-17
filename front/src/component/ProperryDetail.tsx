import { useState } from "react"
import DashboardLayout from "./sidebar"
import Viewer3D from "./viewer3d"
import {
    IconMapPin, IconArrowLeft, IconStar,
    IconSend, IconMap, IconEye
} from "./Icons"
import type { Property, Comment } from "../data/property"

// ── TYPES ─────────────────────────────────────
interface Props {
    prop:        Property
    savedIds:    number[]
    comments:    Comment[]
    onBack:      () => void
    onToggleSave:(id: number) => void
    onAddComment:(text: string) => void
}

const NAV_ITEMS = [
    { label: "Browse",   path: "/dashboard/client" },
    { label: "Saved",    path: "/dashboard/client/saved" },
    { label: "Visits",   path: "/dashboard/client/visits" },
    { label: "Messages", path: "/dashboard/client/messages" },
    { label: "Settings", path: "/dashboard/client/settings" },
]

// ── COMPOSANT ─────────────────────────────────
const PropertyDetail = ({ prop, savedIds, comments, onBack, onToggleSave, onAddComment }: Props) => {
    const [show3D,  setShow3D]  = useState(false)
    const [comment, setComment] = useState("")

    const handleSubmit = () => {
        if (!comment.trim()) return
        onAddComment(comment)
        setComment("")
    }

    return (
        <>
            {/* Modal 3D — au-dessus de tout */}
            {show3D && <Viewer3D prop={prop} onClose={() => setShow3D(false)} />}

            <DashboardLayout navItems={NAV_ITEMS} pageTitle="Property Detail">
                <button className="detail-back" onClick={onBack}>
                    <IconArrowLeft size={16}/> Back to listings
                </button>

                <div className="detail-grid">
                    {/* ── GAUCHE : images + commentaires ─────── */}
                    <div>
                        <div className="detail-hero-block">
                            {/* Grande image + bouton 3D */}
                            <div className="detail-main-img">
                                <img src={prop.img} alt={prop.address} className="detail-main-photo"/>
                                <button className="detail-3d-btn" onClick={() => setShow3D(true)}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                        <path d="M2 17l10 5 10-5"/>
                                        <path d="M2 12l10 5 10-5"/>
                                    </svg>
                                    View in 3D
                                </button>
                            </div>
                            {/* Thumbnails galerie */}
                            <div className="detail-gallery-row">
                                {prop.gallery.map((src, i) => (
                                    <div key={i} className="detail-thumb">
                                        <img src={src} alt={`view ${i + 1}`} className="detail-thumb-photo"/>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Commentaires */}
                        <div className="card" style={{ marginTop: 16 }}>
                            <div className="card-hd">
                                <span className="card-title">Reviews & Comments ({comments.length})</span>
                            </div>
                            {comments.length === 0 && (
                                <p style={{ color: "var(--text3)", fontSize: 13, padding: "12px 0" }}>
                                    No comments yet. Be the first to leave a review.
                                </p>
                            )}
                            {comments.map((c, i) => (
                                <div className="comment-item" key={i}>
                                    <div className="comment-av">{c.name.charAt(0)}</div>
                                    <div className="comment-body">
                                        <div className="comment-header">
                                            <span className="comment-name">{c.name}</span>
                                            <span className="comment-date">{c.date}</span>
                                        </div>
                                        <div className="comment-stars">
                                            {[1,2,3,4,5].map(s => (
                                                <IconStar key={s} size={12} color={s <= c.rating ? "#b8922a" : "#d4cfc7"} filled={s <= c.rating}/>
                                            ))}
                                        </div>
                                        <p className="comment-text">{c.text}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="comment-form">
                                <div className="comment-input-wrap">
                                    <div className="comment-av" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>Y</div>
                                    <input
                                        className="comment-input"
                                        placeholder="Share your thoughts..."
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                                    />
                                </div>
                                <button className="comment-send" onClick={handleSubmit}>
                                    <IconSend size={14} color="white"/>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── DROITE : infos sticky ───────────────── */}
                    <div className="detail-right-panel">
                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                            <span className={`badge badge-${prop.status === "For Sale" ? "sale" : "rent"}`}>
                                {prop.status}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text3)" }}>
                                <IconEye size={13} color="var(--text3)"/> {prop.views.toLocaleString()} views
                            </span>
                        </div>

                        <h1 className="detail-title">{prop.agent}'s Property</h1>
                        <div className="detail-loc">
                            <IconMapPin size={14} color="var(--gold)"/>{prop.address}
                        </div>
                        <div className="detail-price">
                            {prop.price}
                            {prop.status === "For Rent" && <span> / month</span>}
                        </div>

                        <div className="detail-specs">
                            {[["Bedrooms", prop.beds], ["Bathrooms", prop.baths], ["Sq. ft", prop.sqft], ["Rating", prop.rating]].map(([l, v]) => (
                                <div key={String(l)} className="detail-spec">
                                    <span className="detail-spec-val" style={l === "Rating" ? { color: "var(--gold)" } : {}}>{v}</span>
                                    <span className="detail-spec-lbl">{l}</span>
                                </div>
                            ))}
                        </div>

                        <p className="detail-desc">{prop.desc}</p>

                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Features & Amenities</div>
                        <div className="detail-features">
                            {prop.features.map(f => (
                                <span className="feature-chip" key={f}>
                                    <span style={{ width: 5, height: 5, background: "var(--gold)", borderRadius: "50%", flexShrink: 0 }}/>{f}
                                </span>
                            ))}
                        </div>

                        <div className="detail-actions">
                            <button className="btn-primary">Book a Visit</button>
                            <button
                                className="btn-ghost"
                                onClick={() => onToggleSave(prop.id)}
                                style={{ color: savedIds.includes(prop.id) ? "var(--red)" : undefined }}
                            >
                                {savedIds.includes(prop.id) ? "Saved" : "Save"}
                            </button>
                        </div>

                        {/* Carte OpenStreetMap — Lomé */}
                        <div className="detail-map-wrap">
                            <div className="detail-map-header">
                                <IconMap size={14} color="var(--gold)"/>
                                <span>Localisation</span>
                                <span className="detail-map-addr">{prop.address}</span>
                            </div>
                            <div className="detail-map-frame">
                                <iframe
                                    title="map"
                                    className="detail-map-iframe"
                                    src="https://www.openstreetmap.org/export/embed.html?bbox=1.1309%2C6.1096%2C1.2309%2C6.1696&layer=mapnik&marker=6.1375%2C1.2123"
                                    loading="lazy"
                                />
                                <a
                                    href="https://www.openstreetmap.org/?mlat=6.1375&mlon=1.2123#map=14/6.1375/1.2123"
                                    target="_blank" rel="noreferrer"
                                    className="detail-map-link"
                                >
                                    Ouvrir dans OpenStreetMap ↗
                                </a>
                            </div>
                        </div>

                        {/* Agent */}
                        <div className="card" style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px" }}>
                                Listed by
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div className="comment-av" style={{ width: 40, height: 40, fontSize: 15 }}>
                                    {prop.agent.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700 }}>{prop.agent}</div>
                                    <div style={{ fontSize: 11, color: "var(--text3)" }}>Certified Agent · KÔRÂ</div>
                                </div>
                                <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>Contact</button>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </>
    )
}

export default PropertyDetail