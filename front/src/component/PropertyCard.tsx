import { IconHeart, IconMapPin, IconBed, IconBath, IconSquare } from "./Icons"
import type { Property } from "../data/property"

// ── TYPES ─────────────────────────────────────
interface Props {
    prop:    Property
    saved:   boolean
    onSave:  (e: React.MouseEvent) => void
    onClick: () => void
}

// ── COMPOSANT ─────────────────────────────────
const PropertyCard = ({ prop, saved, onSave, onClick }: Props) => (
    <div className="p-card" onClick={onClick}>
        {/* Image + badges */}
        <div className="p-card-img">
            <img src={prop.img} alt={prop.address} className="p-card-photo"/>
            {prop.tag && <span className="p-tag">{prop.tag}</span>}
            <button
                className={`p-save-btn ${saved ? "p-save-btn--saved" : ""}`}
                onClick={onSave}
            >
                <IconHeart size={14} filled={saved} color={saved ? "var(--red)" : "var(--text2)"}/>
            </button>
            <div className="p-agent">
                <div className="p-agent-av">{prop.agent.charAt(0)}</div>
                <span>{prop.agent}</span>
            </div>
            {/* Badge 3D — indique que cette propriété a une vue 3D */}
            <span className="p-3d-badge">3D</span>
        </div>

        {/* Infos */}
        <div className="p-body">
            <div className="p-status">
                <div className={`p-status-dot p-status-dot--${prop.status === "For Sale" ? "sale" : "rent"}`}/>
                <span style={{ color: prop.status === "For Sale" ? "var(--blue)" : "var(--gold)" }}>
                    {prop.status}
                </span>
            </div>
            <div className="p-price">{prop.price}</div>
            <div className="p-specs">
                <div className="p-spec"><IconBed size={12} color="var(--text3)"/>{prop.beds} bed</div>
                <div className="p-spec"><IconBath size={12} color="var(--text3)"/>{prop.baths} bath</div>
                <div className="p-spec"><IconSquare size={12} color="var(--text3)"/>{prop.sqft} sqft</div>
            </div>
            <div className="p-addr">
                <IconMapPin size={10} color="var(--text3)"/>{prop.address}
            </div>
        </div>
    </div>
)

export default PropertyCard