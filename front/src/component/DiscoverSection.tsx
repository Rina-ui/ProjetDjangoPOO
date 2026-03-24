import { useNavigate } from "react-router-dom"

const DiscoverSection = () => {
    const navigate = useNavigate()
    return (
        <section className="discover-section">
            {/* Map visuelle */}
            <div className="discover-map">
                <iframe
                    title="map"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-74.02%2C40.70%2C-73.95%2C40.75&layer=mapnik"
                    style={{ width: "100%", height: "100%", border: "none", borderRadius: 16 }}
                    loading="lazy"
                />
                <div className="discover-map__pin">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1a1a1a" stroke="white" strokeWidth="1.5">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                        <circle cx="12" cy="9" r="2.5" fill="white"/>
                    </svg>
                    <span>Dream Home ↗</span>
                </div>
            </div>

            {/* Texte */}
            <div className="discover-text">
                <h2>Discover Properties with the Best Value</h2>
                <p>
                    From minimalist interiors to compact solutions, small spaces inspire big ideas,
                    proving that you don't need much room.
                </p>
                <button className="discover-btn" onClick={() => navigate("/register")}>
                    Find Nearest Properties →
                </button>
            </div>
        </section>
    )
}

export default DiscoverSection
