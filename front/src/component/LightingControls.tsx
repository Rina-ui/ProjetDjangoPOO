import "../style/lighting.css"

// ── TYPES
export type LightingMode = "day" | "golden" | "night"

export interface LightingConfig {
    mode:            LightingMode
    hour:            number
    ambientColor:    number
    ambientIntensity:number
    sunColor:        number
    sunIntensity:    number
    sunX:            number
    sunY:            number
    sunZ:            number
    fogColor:        number
    bgColor:         number
    fogDensity:      number
}

interface Props {
    currentMode: LightingMode
    currentHour: number
    onChange:    (config: LightingConfig) => void
}

// ── PRESETS D'ÉCLAIRAGE

export const LIGHTING_PRESETS: Record<LightingMode, Omit<LightingConfig, "hour">> = {
    day: {
        mode:             "day",
        ambientColor:     0xfff8f0,
        ambientIntensity: 1.2,
        sunColor:         0xfffbe0,
        sunIntensity:     2.0,
        sunX: 12, sunY: 20, sunZ: 10,
        fogColor:   0xf0ece4,
        bgColor:    0xf0ece4,
        fogDensity: 0.018,
    },
    golden: {
        mode:             "golden",
        ambientColor:     0xff9944,
        ambientIntensity: 0.8,
        sunColor:         0xff7722,
        sunIntensity:     1.5,
        sunX: 18, sunY: 4, sunZ: 8,   // soleil bas sur l'horizon
        fogColor:   0xd4805a,
        bgColor:    0xd4805a,
        fogDensity: 0.022,
    },
    night: {
        mode:             "night",
        ambientColor:     0x223366,
        ambientIntensity: 0.35,
        sunColor:         0x334488,
        sunIntensity:     0.4,
        sunX: -8, sunY: 6, sunZ: -12,  // lumière de lune
        fogColor:   0x0a0d18,
        bgColor:    0x0a0d18,
        fogDensity: 0.028,
    },
}

// ── FONCTION UTILITAIRE
export const getConfigForHour = (hour: number): LightingConfig => {
    // 0-6 : nuit, 6-9 : golden matin, 9-17 : jour, 17-20 : golden soir, 20-24 : nuit
    let mode: LightingMode
    if (hour >= 9 && hour < 17)      mode = "day"
    else if ((hour >= 6 && hour < 9) || (hour >= 17 && hour < 20)) mode = "golden"
    else                              mode = "night"

    return { ...LIGHTING_PRESETS[mode], hour, mode }
}

// ── COMPOSANT UI
const LightingControls = ({ currentMode, currentHour, onChange }: Props) => {

    const selectMode = (mode: LightingMode) => {
        // Heure par défaut pour chaque mode
        const defaultHour = { day: 12, golden: 18, night: 22 }[mode]
        onChange({ ...LIGHTING_PRESETS[mode], hour: defaultHour, mode })
    }

    const selectHour = (hour: number) => {
        onChange(getConfigForHour(hour))
    }

    // Label de l'heure pour l'affichage
    const hourLabel = `${String(Math.floor(currentHour)).padStart(2, "0")}:00`

    // Couleur du gradient selon l'heure
    const sliderGradient = "linear-gradient(to right, #0a0d18 0%, #d4805a 25%, #ffe4b0 45%, #fff8f0 50%, #ffe4b0 55%, #d4805a 75%, #0a0d18 100%)"

    return (
        <div className="ltg-wrap">
            {/* Boutons mode */}
            <div className="ltg-modes">
                <button
                    className={`ltg-mode-btn ${currentMode === "day" ? "active" : ""}`}
                    onClick={() => selectMode("day")}
                    title="Mode jour — 12h00"
                >
                    {/* Icône soleil */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5"/>
                        <line x1="12" y1="1" x2="12" y2="3"/>
                        <line x1="12" y1="21" x2="12" y2="23"/>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                        <line x1="1" y1="12" x2="3" y2="12"/>
                        <line x1="21" y1="12" x2="23" y2="12"/>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                    <span>Jour</span>
                </button>

                <button
                    className={`ltg-mode-btn ${currentMode === "golden" ? "active" : ""}`}
                    onClick={() => selectMode("golden")}
                    title="Golden hour — 18h00"
                >
                    {/* Icône coucher de soleil */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 18a5 5 0 0 0-10 0"/>
                        <line x1="12" y1="2" x2="12" y2="9"/>
                        <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/>
                        <line x1="1" y1="18" x2="3" y2="18"/>
                        <line x1="21" y1="18" x2="23" y2="18"/>
                        <line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/>
                        <line x1="23" y1="22" x2="1" y2="22"/>
                        <polyline points="8 6 12 2 16 6"/>
                    </svg>
                    <span>Golden</span>
                </button>

                <button
                    className={`ltg-mode-btn ${currentMode === "night" ? "active" : ""}`}
                    onClick={() => selectMode("night")}
                    title="Mode nuit — 22h00"
                >
                    {/* Icône lune */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                    <span>Nuit</span>
                </button>
            </div>

            {/* Slider heure */}
            <div className="ltg-slider-wrap">
                <span className="ltg-hour-label">{hourLabel}</span>
                <div className="ltg-slider-track" style={{ background: sliderGradient }}>
                    <input
                        type="range"
                        className="ltg-slider"
                        min={0} max={24} step={0.5}
                        value={currentHour}
                        onChange={e => selectHour(Number(e.target.value))}
                    />
                </div>
                <div className="ltg-slider-ticks">
                    {["0h","6h","12h","18h","24h"].map(t => (
                        <span key={t}>{t}</span>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default LightingControls